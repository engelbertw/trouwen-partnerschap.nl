# CRUD Functionaliteit Beheer Tabellen - Compleet

## ✅ Wat is toegevoegd

### 1. **Volledig CRUD Formulier** (Create, Read, Update, Delete)

**Locatie**: `src/app/gemeente/beheer/lookup/page.tsx`

#### Features:
- ✅ **Bewerken** knop bij elk item
- ✅ **Verwijderen** knop bij elk item  
- ✅ **Nieuw toevoegen** knop opent formulier
- ✅ Dynamisch formulier per tab type
- ✅ Pre-filled form bij bewerken
- ✅ Cancel functionaliteit

### 2. **Documentopties Formulier**

Specifiek voor de "Documenten" tab:

**Velden:**
- Code * (verplicht, uniek per gemeente)
- Naam * (verplicht)
- Omschrijving (optioneel, textarea)
- Papier Type * (dropdown met opties)
- Prijs (in eurocenten, met live preview in euro's)
- Volgorde (nummer, default 1)
- **Checkboxes:**
  - Gratis (zet automatisch prijs op 0)
  - Verplicht
  - Actief

**Validatie:**
- Gratis documenten kunnen geen prijs hebben
- Alle verplichte velden worden gevalideerd

### 3. **Andere Lookup Formulieren**

#### Locaties:
- Code, Naam, Type (dropdown)
- Adres, Capaciteit, Prijs, Volgorde
- Actief checkbox

#### BABS:
- Naam, Status
- Actief checkbox

#### Type Ceremonie:
- Code, Naam
- Actief checkbox

### 4. **PUT (Update) API Endpoints**

Toegevoegd voor alle lookup tables die het nog niet hadden:

#### Documenten
**PUT /api/gemeente/lookup/documenten/[id]**
- Update document optie
- Validatie van gratis/prijs logica
- Gemeente-specifieke filtering

#### BABS (Nieuw)
**PUT /api/gemeente/lookup/babs/[id]**
- Update BABS entry
- Soft delete (actief = false)

**Locatie**: `src/app/api/gemeente/lookup/babs/[id]/route.ts`

#### Type Ceremonie (Nieuw)
**PUT /api/gemeente/lookup/type-ceremonie/[id]**
- Update type ceremonie
- Soft delete (actief = false)

**Locatie**: `src/app/api/gemeente/lookup/type-ceremonie/[id]/route.ts`

### 5. **State Management**

**Nieuwe state variables:**
```typescript
const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
const [formData, setFormData] = useState<Record<string, any>>({});
```

**Handlers:**
- `handleEdit(item)` - Open formulier met bestaande data
- `handleCancelForm()` - Reset formulier en sluit
- `handleSubmitForm(e)` - POST voor nieuw, PUT voor bewerken
- `handleDelete(id)` - DELETE met confirmatie

### 6. **UX Verbeteringen**

✅ **Formulier gedrag:**
- Automatisch reset bij tab wissel
- Cancel knop sluit formulier
- Submit knop toont "Toevoegen" of "Bijwerken"
- Loading states tijdens opslaan

✅ **Visuele feedback:**
- Bewerk knop (blauw) voor edit actie
- Verwijder knop (rood) voor delete actie
- Confirmatie dialog bij verwijderen
- Error alerts bij fouten

✅ **Live preview:**
- Prijs in cents → Euro's weergave
- Gratis checkbox reset prijs automatisch

## 🎯 Functionaliteit Per Tab

### Documenten Tab
| Actie | Functionaliteit | Status |
|-------|----------------|--------|
| Bekijken | Lijst met alle documentopties | ✅ |
| Toevoegen | Formulier met volledige validatie | ✅ |
| Bewerken | Pre-filled form, UPDATE via API | ✅ |
| Verwijderen | Soft delete via API | ✅ |

### Locaties Tab
| Actie | Functionaliteit | Status |
|-------|----------------|--------|
| Bekijken | Lijst met alle locaties | ✅ |
| Toevoegen | Volledig formulier | ✅ |
| Bewerken | UPDATE via bestaande API | ✅ |
| Verwijderen | Soft delete | ✅ |

### BABS Tab
| Actie | Functionaliteit | Status |
|-------|----------------|--------|
| Bekijken | Lijst met alle BABS | ✅ |
| Toevoegen | Formulier | ✅ |
| Bewerken | UPDATE via nieuwe API | ✅ |
| Verwijderen | Soft delete | ✅ |

### Type Ceremonie Tab
| Actie | Functionaliteit | Status |
|-------|----------------|--------|
| Bekijken | Lijst met alle types | ✅ |
| Toevoegen | Formulier | ✅ |
| Bewerken | UPDATE via nieuwe API | ✅ |
| Verwijderen | Soft delete | ✅ |

## 📋 Voorbeelden

### Toevoegen Nieuwe Documentoptie

1. Klik op tab "Documenten"
2. Klik "Nieuw toevoegen"
3. Vul formulier in:
   - Code: `extra-akte-luxe`
   - Naam: `Extra luxe huwelijksakte`
   - Omschrijving: `Een extra luxe uitgevoerde akte met gouden rand`
   - Papier Type: `geboorteakte`
   - Prijs: `2500` (€25,00 preview verschijnt)
   - Volgorde: `5`
   - ☑ Actief
4. Klik "Toevoegen"
5. Item verschijnt in lijst

### Bewerken Bestaande Documentoptie

1. Klik "Bewerken" bij item
2. Formulier opent met huidige waarden
3. Wijzig velden (bijv. prijs van 1710 → 2000)
4. Klik "Bijwerken"
5. Lijst refresh met nieuwe waarden

### Verwijderen Documentoptie

1. Klik "Verwijderen" bij item
2. Confirmatie dialog verschijnt
3. Bevestig verwijdering
4. Item wordt gedeactiveerd (soft delete)
5. Lijst refresh zonder item (indien gefilterd op actief)

## 🔧 Technische Details

### API Request Flow

**Create (POST):**
```
POST /api/gemeente/lookup/{tab}
Body: { ...formData }
→ Insert nieuwe record
→ Return success + data
```

**Update (PUT):**
```
PUT /api/gemeente/lookup/{tab}/{id}
Body: { ...formData }
→ Update bestaande record
→ Return success + updated data
```

**Delete (DELETE):**
```
DELETE /api/gemeente/lookup/{tab}/{id}
→ Soft delete (actief = false)
→ Return success message
```

### Form Submission Logic

```typescript
const method = editingItem ? 'PUT' : 'POST';
const url = editingItem
  ? `/api/gemeente/lookup/${activeTab}/${editingItem.id}`
  : `/api/gemeente/lookup/${activeTab}`;
```

### Validatie (Documenten)

```typescript
// Gratis documenten mogen geen prijs hebben
if (gratis && prijsCents > 0) {
  return error('Gratis documenten kunnen geen prijs hebben');
}

// Auto-reset prijs bij gratis checkbox
onChange={(e) => setFormData({ 
  ...formData, 
  gratis: e.target.checked, 
  prijsCents: e.target.checked ? 0 : formData.prijsCents 
})}
```

## 📁 Aangepaste Bestanden

### Frontend:
- `src/app/gemeente/beheer/lookup/page.tsx` (volledig uitgebreid)

### Backend API:
- `src/app/api/gemeente/lookup/documenten/[id]/route.ts` (PUT toegevoegd)
- `src/app/api/gemeente/lookup/babs/[id]/route.ts` (nieuw)
- `src/app/api/gemeente/lookup/type-ceremonie/[id]/route.ts` (nieuw)

## ✨ Gebruikersflow

### Gemeente Beheerder:
1. Login met gemeente account
2. Ga naar "Gemeente Beheer" → "Standaard tabellen"
3. Selecteer gewenste tab (Locaties/BABS/Type Ceremonie/Documenten)
4. Zie overzicht van items
5. Acties:
   - **Toevoegen**: Klik "Nieuw toevoegen" → Vul formulier → Submit
   - **Bewerken**: Klik "Bewerken" → Wijzig velden → Submit
   - **Verwijderen**: Klik "Verwijderen" → Bevestig
6. Wijzigingen direct zichtbaar voor burgers

### Burger Impact:
- Ziet alleen **actieve** items in dossier flows
- Nieuwe documentopties direct beschikbaar
- Prijswijzigingen direct zichtbaar
- Gedeactiveerde items verdwijnen uit selectie

## 🎉 Conclusie

Het beheer scherm heeft nu **volledige CRUD functionaliteit** voor alle lookup tabellen:

✅ **Create** - Nieuw toevoegen formulier  
✅ **Read** - Lijst met alle items  
✅ **Update** - Bewerken van bestaande items  
✅ **Delete** - Verwijderen (soft delete)  

Alle formulieren zijn type-specifiek, hebben validatie, en werken met echte database operaties. De implementatie is consistent over alle tabs en volledig multi-tenant (gemeente-specifiek).

**Status**: ✅ **COMPLEET EN KLAAR VOOR GEBRUIK**

