# Forceer Goedkeuring - Gemeente Beheer Update

## ✅ Wat is Toegevoegd

### 1. **"Forceer goedkeuring" Knop**

Voor **afgekeurde aankondigingen** zijn er nu extra acties beschikbaar:

**Vóór**:
- ❌ Afgekeurd → Alleen tooltip met korte reden (afgeknipt na 30 tekens)
- Geen mogelijkheid om alsnog goed te keuren

**Nu**:
- ❌ Afgekeurd → **"Toon reden"** knop (onderstreept, grijs)
- 🟠 **"Forceer goedkeuring"** knop (oranje, opvallend)

### 2. **Reden Modal**

**Functionaliteit**:
- Klik "Toon reden" → Modal opent
- Toont **volledige afkeuringsreden** (niet afgeknipt)
- Rode warning box met icon
- Witruimte behouden (multi-line support)
- Direct actie mogelijk: "Forceer goedkeuring" knop in modal
- "Sluiten" knop om te annuleren

**Design**:
- Overlay met darkened background
- Centered modal (max-width: 2xl)
- Responsive (padding op kleine schermen)
- Close button (X) rechtsboven

### 3. **Forceer Goedkeuring Flow**

**Confirmation**:
```javascript
confirm('Weet u zeker dat u deze afgekeurde aankondiging alsnog wilt goedkeuren? 
Dit overschrijft de eerdere afkeuring.')
```

**Acties**:
1. Hergebruikt bestaande `/goedkeuren` endpoint
2. Updates `valid = true`
3. Cleart `invalid_reason`
4. Set `gevalideerd_op = NOW()`
5. Update dossier status naar `in_review`
6. Markeer aankondiging block als compleet
7. Refresh lijst → Verplaatst naar "Goedgekeurd" filter

## 🎯 Gebruik

### Scenario 1: Automatisch Afgekeurd

**Situatie**: Aankondiging heeft automatische showstopper (bijv. puntouders)

**Stappen**:
1. Filter op "Afgekeurd"
2. Zie aankondiging met rode badge
3. Klik **"Toon reden"**
4. Lees volledige afkeuringsreden:
   ```
   Partner 1 heeft puntouders (ouders onbekend).
   Dit is een showstopper voor aankondiging volgens de wet.
   ```
5. Beslis: Is er een uitzondering mogelijk?
6. Klik **"Forceer goedkeuring"** (in modal of in tabel)
7. Bevestig in dialog
8. ✅ Aankondiging alsnog goedgekeurd

### Scenario 2: Handmatig Afgekeurd

**Situatie**: Collega heeft aankondiging afgekeurd, maar er is nu nieuwe informatie

**Stappen**:
1. Filter op "Afgekeurd"
2. Zie aankondiging
3. Klik **"Toon reden"**
4. Lees reden: "Documenten ontbreken"
5. Check dossier → Documenten zijn nu toegevoegd
6. Klik **"Forceer goedkeuring"**
7. Bevestig
8. ✅ Aankondiging goedgekeurd

### Scenario 3: Gemeente Uitzondering

**Situatie**: Speciale omstandigheden vereisen handmatige goedkeuring

**Stappen**:
1. Zie afgekeurde aankondiging
2. Lees reden via "Toon reden"
3. Overleg met leidinggevende
4. Besluit: Uitzondering toegestaan
5. Klik **"Forceer goedkeuring"**
6. ✅ Goedgekeurd ondanks showstopper

## 📋 UI Veranderingen

### Acties Kolom - Afgekeurde Aankondigingen

**Vóór**:
```
[ Bekijken ] [ Reden: Partner 1 heeft puntouders... ]
```

**Nu**:
```
[ Bekijken ] [ Toon reden ] [ Forceer goedkeuring ]
```

### Knop Styling

**"Toon reden"**:
- Kleur: Grijs (`text-gray-600`)
- Hover: Donkerder grijs
- Onderstreept voor duidelijkheid
- Font size: xs (klein, niet dominant)

**"Forceer goedkeuring"**:
- Kleur: Oranje (`text-orange-600`)
- Hover: Donker oranje
- Font weight: Semibold (opvallend)
- Duidelijk een "admin override" actie

### Modal Layout

```
┌────────────────────────────────────┐
│ Reden voor afkeuring           [X] │
├────────────────────────────────────┤
│                                    │
│  ⚠️  [Volledige afkeuringsreden]   │
│                                    │
├────────────────────────────────────┤
│ [ Forceer goedkeuring ]  [Sluiten] │
└────────────────────────────────────┘
```

## 🔧 Technische Details

### State Management

```typescript
const [showReasonModal, setShowReasonModal] = useState<{
  show: boolean;
  reason: string;
  dossierId: string;
} | null>(null);
```

### Nieuwe Handlers

```typescript
// Toon reden in modal
const handleToonReden = (reason: string, dossierId: string) => {
  setShowReasonModal({ show: true, reason, dossierId });
};

// Forceer goedkeuring (ook voor afgekeurde)
const handleForceerGoedkeuren = async (dossierId: string) => {
  if (!confirm('Weet u zeker...')) return;
  
  // Hergebruik bestaande /goedkeuren endpoint
  const response = await fetch(
    `/api/gemeente/aankondigingen/${dossierId}/goedkeuren`,
    { method: 'POST' }
  );
  
  if (result.success) {
    await fetchAankondigingen(); // Refresh lijst
  }
};
```

### API Endpoint (Bestaand)

**Endpoint**: `POST /api/gemeente/aankondigingen/[id]/goedkeuren`

**Gedrag**:
- Werkt voor **pending** én **rejected** aankondigingen
- Overschrijft eerdere status
- Cleart `invalid_reason`
- Set `valid = true`

**Geen nieuwe endpoint nodig** - bestaande endpoint is al geschikt!

## 🔒 Security & Controle

### Dubbele Confirmatie

1. **Eerste check**: Klik "Forceer goedkeuring"
2. **Dialog**: "Weet u zeker dat u deze afgekeurde aankondiging alsnog wilt goedkeuren?"
3. **Alleen bij "OK"**: Daadwerkelijke goedkeuring

### Audit Trail

Database tracking blijft intact:
```sql
gevalideerd_op    TIMESTAMPTZ  -- Updated naar nieuwe datum
gevalideerd_door  TEXT         -- Updated naar huidige medewerker
valid             BOOLEAN      -- false → true
invalid_reason    TEXT         -- Cleared (NULL)
```

**Let op**: Historie van eerdere afkeuring is niet meer zichtbaar na forceren. Voor volledige audit trail zou je een aparte `aankondiging_log` tabel kunnen overwegen.

## 📊 Voorbeelden

### Voorbeeld 1: Puntouders Showstopper

**Afkeuringsreden**:
```
Partner 1 heeft puntouders (ouders onbekend).
Dit is een showstopper voor aankondiging volgens artikel 1:64 BW.
Uitzondering alleen mogelijk met rechterlijke toestemming.
```

**Actie gemeente**:
1. Toon reden → Lees volledige tekst
2. Check: Heeft burger rechterlijke toestemming?
3. Ja → Forceer goedkeuring
4. Document nummer rechterlijke beschikking in notities

### Voorbeeld 2: Woonplaats Discussie

**Afkeuringsreden**:
```
Geen van beide partners woont in de gemeente.
Volgens artikel 1:63 BW moet ten minste één partner ingezetene zijn.
```

**Actie gemeente**:
1. Toon reden
2. Check GBA: Partner 2 net verhuisd naar gemeente
3. GBA nog niet geüpdatet
4. Forceer goedkeuring → Aankondiging alsnog geldig

### Voorbeeld 3: Foutieve Automatische Check

**Afkeuringsreden**:
```
Partner 1 is mogelijk al gehuwd volgens BRP check.
Controleer handmatig in de BRP registratie.
```

**Actie gemeente**:
1. Toon reden
2. Handmatige BRP check: Partner is gescheiden, registratie klopt
3. Systeem had onjuiste data
4. Forceer goedkeuring → Corrigeer automatische fout

## ✨ Voordelen

✅ **Volledig leesbaar**: Afkeuringsreden niet meer afgeknipt  
✅ **Flexibiliteit**: Gemeente kan uitzonderingen toestaan  
✅ **Duidelijke UI**: Oranje kleur = admin override  
✅ **Double check**: Confirmation dialog voorkomt ongelukken  
✅ **Modal UX**: Grotere tekst, betere leesbaarheid  
✅ **Direct actie**: Forceren kan direct vanuit modal  
✅ **Consistent**: Hergebruikt bestaande goedkeur-logica  

## 🎨 Visual Design

**Kleurenschema**:
- 🟡 Te beoordelen: Geel
- 🟢 Goedgekeurd: Groen  
- 🔴 Afgekeurd: Rood
- 🟠 **Forceer goedkeuring: Oranje** ← Nieuw!
- ⚪ Toon reden: Grijs (ondersteunende actie)

**Hiërarchie**:
1. **Primair**: Bekijken (blauw) - Altijd beschikbaar
2. **Secundair**: Goedkeuren (groen) / Afkeuren (rood) - Voor pending
3. **Tertiary**: Toon reden (grijs) - Voor afgekeurd
4. **Admin**: Forceer goedkeuring (oranje) - Voor afgekeurd

## 📁 Gewijzigde Bestanden

**Frontend**:
- `src/app/gemeente/beheer/page.tsx` - Toegevoegd:
  - State: `showReasonModal`
  - Handler: `handleForceerGoedkeuren()`
  - Handler: `handleToonReden()`
  - UI: "Toon reden" knop
  - UI: "Forceer goedkeuring" knop
  - Component: Reden modal

**Backend**:
- Geen wijzigingen nodig! Bestaande endpoint werkt al perfect.

## 🎉 Conclusie

Gemeente medewerkers kunnen nu:

✅ **Volledige reden lezen** via modal (niet meer afgeknipt)  
✅ **Forceer goedkeuring** uitvoeren voor afgekeurde aankondigingen  
✅ **Uitzonderingen toestaan** bij bijzondere omstandigheden  
✅ **Correcties maken** als automatische checks fout zijn  

**Status**: ✅ **GEÏMPLEMENTEERD EN KLAAR VOOR GEBRUIK**

De gemeente heeft nu volledige controle over het goedkeuringsproces! 🚀

