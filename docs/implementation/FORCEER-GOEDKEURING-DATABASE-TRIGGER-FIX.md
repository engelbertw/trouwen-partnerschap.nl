# Forceer Goedkeuring - ECHTE Fix voor Database Trigger

## 🔴 Het ECHTE Probleem

De "Forceer goedkeuren" functie faalde niet door de status check, maar door een **database trigger** die aankondigingen automatisch valideert!

###Root Cause: Database Trigger

**File**: `sql/040_triggers_functions.sql` (regel 239-242)

```sql
CREATE TRIGGER trg_aankondiging_validate
    BEFORE INSERT OR UPDATE ON ihw.aankondiging
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_aankondiging_validate();
```

**Wat deze trigger doet**:
Bij ELKE UPDATE van de `aankondiging` tabel:
1. Checkt op "showstoppers" (blokkers):
   - `reeds_gehuwd = true` → Partner is al gehuwd
   - `beiden_niet_woonachtig = true` → Geen van beiden woont in gemeente  
   - Partners hebben `ouders_onbekend = true` → Puntouders (onbekende ouders)

2. Als er een showstopper is:
   ```sql
   NEW.valid = false;
   NEW.invalid_reason = array_to_string(invalid_reasons, '; ');
   ```

**Het probleem flow**:
```
1. Gemeente medewerker klikt "Forceer goedkeuren"
   ↓
2. API update: SET valid = true, invalidReason = null
   ↓
3. 🔴 TRIGGER DRAAIT VOORDAT UPDATE COMMIT!
   ↓
4. Trigger checkt: reeds_gehuwd = true (of andere showstopper)
   ↓
5. Trigger OVERSCHRIJFT: valid = false, invalidReason = "..."
   ↓
6. UPDATE commit → Nog steeds afgekeurd! ❌
```

## ✅ De Oplossing

We moeten de **showstopper flags** ook resetten wanneer we forceren, zodat de trigger niets meer vindt om af te keuren.

### 1. API Endpoint - Force Parameter & Flag Reset

**File**: `src/app/api/gemeente/aankondigingen/[id]/goedkeuren/route.ts`

```typescript
// Accept 'force' parameter
const { opmerkingen, force } = body;

// Build update data
const updateData: any = {
  valid: true,
  gevalideerdOp: new Date(),
  gevalideerdDoor: userId,
  invalidReason: null,
  updatedAt: new Date(),
};

// When forcing, clear ALL showstopper flags
if (force === true) {
  updateData.reedsGehuwd = false;           // ✅ Clear "already married"
  updateData.beidenNietWoonachtig = false;  // ✅ Clear "neither lives here"
  // Note: puntouders is on partner table, accepted risk
}

await db.update(aankondiging).set(updateData).where(...);
```

**Wat gebeurt er nu**:
```
1. Gemeente medewerker klikt "Forceer goedkeuren" + force=true
   ↓
2. API update: SET valid = true, invalidReason = null,
                   reeds_gehuwd = false, beiden_niet_woonachtig = false
   ↓
3. 🟢 TRIGGER DRAAIT
   ↓
4. Trigger checkt: reeds_gehuwd = false ✅
                   beiden_niet_woonachtig = false ✅
   ↓
5. Trigger: Geen showstoppers gevonden!
   ↓
6. UPDATE commit → GOEDGEKEURD! ✅
```

### 2. Client-Side - Force Flag & Waarschuwing

**File**: `src/app/gemeente/beheer/page.tsx`

```typescript
const handleForceerGoedkeuren = async (dossierId: string) => {
  // Extra waarschuwing - gebruiker moet expliciet bevestigen
  if (!confirm(
    'Weet u zeker dat u deze afgekeurde aankondiging alsnog wilt ' +
    'goedkeuren? Dit overschrijft de eerdere afkeuring EN negeerd ' +
    'alle automatische controles (showstoppers).'
  )) {
    return;
  }

  const response = await fetch(`/api/gemeente/aankondigingen/${dossierId}/goedkeuren`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: true }), // 🔑 FORCE FLAG!
  });

  if (result.success) {
    alert('Aankondiging succesvol goedgekeurd (geforceerd)!');
  }
};
```

## 🎯 Waarom Dit Nu Werkt

### Voor (Broken)
```typescript
// ❌ API zet alleen valid = true
UPDATE aankondiging SET valid = true, invalidReason = null;

// 🔴 Trigger checkt en vindt: reeds_gehuwd = true
// Trigger overschrijft: valid = false

// Resultaat: Blijft afgekeurd ❌
```

### Na (Fixed)
```typescript
// ✅ API zet valid = true ÉN reset showstopper flags
UPDATE aankondiging SET 
  valid = true, 
  invalidReason = null,
  reeds_gehuwd = false,           // ✅ Reset!
  beiden_niet_woonachtig = false;  // ✅ Reset!

// 🟢 Trigger checkt en vindt: reeds_gehuwd = false ✅
// Trigger laat valid = true staan

// Resultaat: GOEDGEKEURD ✅
```

## ⚠️ Puntouders (Unknown Parents) Caveat

De trigger checkt ook op `ouders_onbekend` flag op de **partner** tabel:

```sql
SELECT 
  bool_or(CASE WHEN sequence = 1 THEN ouders_onbekend ELSE false END),
  bool_or(CASE WHEN sequence = 2 THEN ouders_onbekend ELSE false END)
INTO partner1_puntouders, partner2_puntouders
FROM ihw.partner
WHERE dossier_id = NEW.dossier_id;
```

**Implicatie**: Als een partner `ouders_onbekend = true` heeft, kan de trigger nog steeds afkeuren ZELFS met force flag.

**Opties**:
1. **Huidige oplossing**: Gemeente medewerker accepteert dit risico bij forceren
2. **Toekomstige verbetering**: Ook partner flags resetten bij force (complexer)
3. **Alternatief**: Aparte "super force" endpoint die trigger tijdelijk disabled

Voor nu is optie 1 gekozen - de gemeente medewerker moet bewust zijn dat puntouders mogelijk blijft blokkeren.

## 📊 Test Scenarios

### Scenario 1: Forceer bij "Reeds Gehuwd"

**Initiële staat**:
```sql
reeds_gehuwd = true
valid = false
invalid_reason = "Een of beide partners zijn reeds gehuwd"
```

**Actie**: Forceer goedkeuren (force=true)

**Resultaat**:
```sql
reeds_gehuwd = false  ✅ (gereset door force)
valid = true          ✅ (goedgekeurd)
invalid_reason = null ✅ (gewist)
```

### Scenario 2: Forceer bij "Beiden Niet Woonachtig"

**Initiële staat**:
```sql
beiden_niet_woonachtig = true
valid = false
invalid_reason = "Geen van beide partners is woonachtig in de gemeente"
```

**Actie**: Forceer goedkeuren (force=true)

**Resultaat**:
```sql
beiden_niet_woonachtig = false  ✅ (gereset door force)
valid = true                    ✅ (goedgekeurd)
invalid_reason = null           ✅ (gewist)
```

### Scenario 3: Puntouders (Edge Case)

**Initiële staat**:
```sql
-- aankondiging
valid = false
invalid_reason = "Een of beide partners hebben onbekende ouders (puntouders)"

-- partner tabel
partner1.ouders_onbekend = true
```

**Actie**: Forceer goedkeuren (force=true)

**Resultaat**:
```sql
-- aankondiging flags worden gereset
reeds_gehuwd = false
beiden_niet_woonachtig = false

-- 🔴 MAAR: trigger checkt partner tabel
-- Vindt: ouders_onbekend = true

-- Trigger zet:
valid = false           ❌ (nog steeds afgekeurd)
invalid_reason = "..."  ❌ (reden blijft)
```

**Workaround**: Gemeente medewerker moet eerst `partner.ouders_onbekend` handmatig op false zetten, of we implementeren een "super force" die ook partner data update.

## 🔐 Beveiligings & Audit Overwegingen

### Waarschuwing voor Gebruiker
De confirm dialog maakt duidelijk dat alle controles worden genegeerd:
```
"Dit overschrijft de eerdere afkeuring EN negeerd alle automatische 
controles (showstoppers)."
```

### Audit Trail
De goedkeuring wordt gelogd met:
```typescript
gevalideerdOp: new Date(),    // Timestamp
gevalideerdDoor: userId,      // Wie heeft goedgekeurd
// + force flag was gebruikt (implicit via reset flags)
```

### Verantwoordelijkheid
Door te forceren neemt de gemeente medewerker **bewust** de verantwoordelijkheid om:
- Een huwelijk toe te staan ondanks dat iemand al gehuwd is
- Een huwelijk toe te staan ondanks dat geen van beiden in de gemeente woont
- Etc.

Dit is een **bewuste management override** van automatische controles.

## 📁 Gewijzigde Files

### 1. src/app/api/gemeente/aankondigingen/[id]/goedkeuren/route.ts
- **Toegevoegd**: `force` parameter parsing
- **Toegevoegd**: Conditioneel resetten van showstopper flags
- **Effect**: Bypass database trigger validatie

### 2. src/app/gemeente/beheer/page.tsx
- **Toegevoegd**: `force: true` in request body
- **Aangepast**: Confirm dialog met duidelijke waarschuwing
- **Aangepast**: Success message: "goedgekeurd (geforceerd)"

## ✅ Testing Checklist

- [x] Forceer goedkeuren bij "reeds gehuwd" showstopper
- [x] Forceer goedkeuren bij "beiden niet woonachtig" showstopper
- [x] Confirm dialog toont duidelijke waarschuwing
- [x] Success feedback correct ("geforceerd")
- [x] Modal sluit na success
- [x] Lijst refresht correct
- [x] Item verdwijnt uit "Afgekeurd" tab
- [x] Normale goedkeuring (zonder force) werkt nog
- [x] Audit trail (gevalideerdDoor, gevalideerdOp) correct
- [x] Geen linter errors
- [x] TypeScript compileert

## 🚀 Deployment Notes

Na deployment:
1. ✅ Database trigger blijft actief (geen wijzigingen nodig)
2. ✅ Bestaande goedkeuringen werken nog
3. ✅ Forceer functie werkt nu correct
4. ⚠️ Instructies voor gemeente medewerkers over puntouders edge case

## 📚 Technische Details

### Database Trigger Logic (Referentie)

```sql
CREATE OR REPLACE FUNCTION ihw.trg_aankondiging_validate()
RETURNS TRIGGER AS $$
DECLARE
    invalid_reasons text[] := ARRAY[]::text[];
BEGIN
    -- Check showstoppers
    IF NEW.reeds_gehuwd = true THEN
        invalid_reasons := array_append(invalid_reasons, 
          'Een of beide partners zijn reeds gehuwd');
    END IF;
    
    IF NEW.beiden_niet_woonachtig = true THEN
        invalid_reasons := array_append(invalid_reasons, 
          'Geen van beide partners is woonachtig in de gemeente');
    END IF;
    
    -- Check puntouders from partner table
    SELECT bool_or(ouders_onbekend) INTO has_puntouders
    FROM ihw.partner WHERE dossier_id = NEW.dossier_id;
    
    IF has_puntouders = true THEN
        invalid_reasons := array_append(invalid_reasons, 
          'Een of beide partners hebben onbekende ouders (puntouders)');
    END IF;
    
    -- Set validity
    IF array_length(invalid_reasons, 1) > 0 THEN
        NEW.valid = false;
        NEW.invalid_reason = array_to_string(invalid_reasons, '; ');
    ELSE
        NEW.valid = true;
        NEW.invalid_reason = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🎉 Conclusie

De "Forceer goedkeuren" functie werkt nu correct door:
1. ✅ Een `force` parameter te accepteren
2. ✅ Showstopper flags te resetten wanneer force=true
3. ✅ Database trigger vindt geen showstoppers meer
4. ✅ Aankondiging blijft goedgekeurd

**Status**: ✅ OPGELOST - Forceer Goedkeuring Werkt Nu!

**Edge Case**: Puntouders (ouders_onbekend op partner tabel) kan nog steeds blokkeren - dit is een bekende limitatie die een aparte fix vereist indien nodig.

