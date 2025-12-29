# BABS Recurring Rules: Edit & Workdays Feature

## Datum
28 December 2025

## Overzicht
Twee nieuwe features toegevoegd aan BABS Recurring Rules:
1. **Edit functionaliteit** - Bewerk bestaande terugkerende beschikbaarheidsregels
2. **Workdays rule type** - Stel beschikbaarheid in voor alle werkdagen (ma-vr) in één keer

---

## Feature 1: Edit Recurring Rules ✎

### Beschrijving
Gebruikers kunnen nu bestaande terugkerende beschikbaarheidsregels bewerken in plaats van ze te moeten verwijderen en opnieuw aan te maken.

### UI Changes
- **Edit knop (✎)** toegevoegd naast delete knop (✕) in de recurring rules lijst
- Modal toont "Bewerken" in plaats van "Toevoegen" bij edit mode
- Button text: "Beschikbaarheid bijwerken" in plaats van "Beschikbaarheid toevoegen"
- Form wordt automatisch vooringevuld met bestaande waarden

### Backend Changes
- **Nieuw PUT endpoint**: `/api/gemeente/babs/[babsId]/recurring-rules/[ruleId]`
- Validatie: authorisatie check (alleen eigen BABS of admin)
- Update van alle velden inclusief timestamps

### Gebruikersstroom
1. Navigeer naar BABS Calendar pagina
2. Scroll naar "Terugkerende beschikbaarheid" sectie
3. Klik op **✎** knop bij een regel
4. Wijzig de gewenste velden
5. Klik "Beschikbaarheid bijwerken"
6. Regel wordt bijgewerkt in database

### Bestanden Gewijzigd
- `src/app/gemeente/beheer/babs/[babsId]/calendar/page.tsx`
  - `editingRule` state toegevoegd
  - `handleEditRule()` functie
  - `handleCancelEditRule()` functie
  - Updated `handleAddRule()` voor edit support
  - UI met edit knop
  
- `src/app/api/gemeente/babs/[babsId]/recurring-rules/[ruleId]/route.ts`
  - Nieuw `PUT` export function

---

## Feature 2: Workdays Rule Type 📅

### Beschrijving
Nieuwe regel type "workdays" waarmee in één keer beschikbaarheid kan worden ingesteld voor alle werkdagen (maandag t/m vrijdag).

### Voordelen
- **Efficiënter**: Geen 5 aparte regels meer nodig voor elke werkdag
- **Overzichtelijker**: Eén regel in plaats van vijf
- **Makkelijker te onderhouden**: Wijzig werkdagen in één keer

### Gebruik
1. Klik "➕ Beschikbaarheid toevoegen"
2. Selecteer "**Elke werkdag (maandag t/m vrijdag)**"
3. Stel tijden in (bijv. 09:00 - 17:00)
4. Stel geldigheidsperiode in
5. Klik "Beschikbaarheid toevoegen"

### UI Feedback
Bij selectie van "workdays" wordt informatieve message getoond:
```
📅 Deze regel geldt automatisch voor maandag t/m vrijdag
```

### Database Changes
**Migratie**: `sql/migrations/111_add_workdays_rule_type.sql`

```sql
-- Drop oude constraint
ALTER TABLE ihw.babs_recurring_rule 
  DROP CONSTRAINT IF EXISTS babs_recurring_rule_rule_type_check;

-- Voeg nieuwe constraint toe met workdays
ALTER TABLE ihw.babs_recurring_rule 
  ADD CONSTRAINT babs_recurring_rule_rule_type_check 
  CHECK (rule_type IN ('weekly', 'biweekly', 'monthly_day', 'monthly_weekday', 'workdays'));
```

### Bestanden Gewijzigd
- `src/app/gemeente/beheer/babs/[babsId]/calendar/page.tsx`
  - "workdays" optie toegevoegd in select dropdown
  - Conditional rendering voor workdays info message
  - `getRuleDescription()` updated voor workdays display
  
- `sql/migrations/111_add_workdays_rule_type.sql`
  - Database constraint update
  
- `scripts/run-workdays-migration.js`
  - Migratie script

### Display
In de lijst wordt "workdays" getoond als:
```
Elke werkdag (ma-vr)
09:00 - 17:00
```

---

## Technische Details

### API Endpoints

#### PUT /api/gemeente/babs/[babsId]/recurring-rules/[ruleId]
**Request Body:**
```json
{
  "ruleType": "workdays",
  "startTime": "09:00",
  "endTime": "17:00",
  "validFrom": "2025-01-01",
  "validUntil": "2025-12-31",
  "description": "Kantooruren"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Regel succesvol bijgewerkt"
}
```

### Rule Types
| Type | Beschrijving | Vereiste velden |
|------|--------------|-----------------|
| `weekly` | Elke week zelfde dag | dayOfWeek |
| `workdays` | **NIEUW** - Ma t/m vr | - |
| `biweekly` | Om de week | dayOfWeek, intervalWeeks |
| `monthly_day` | Maandelijks op datum | dayOfMonth |
| `monthly_weekday` | Maandelijks op weekdag | dayOfWeek, weekOfMonth |

### Authorisatie
Beide features respecteren de bestaande authorisatie:
- **Admin gebruikers**: kunnen alle BABS beheren
- **BABS gebruikers**: kunnen alleen eigen beschikbaarheid beheren

---

## Testing

### Test Scenario 1: Edit Regel
1. ✅ Maak nieuwe regel aan (bijv. "Elke Maandag 09:00-17:00")
2. ✅ Klik edit knop (✎)
3. ✅ Wijzig tijd naar 10:00-16:00
4. ✅ Klik "Beschikbaarheid bijwerken"
5. ✅ Verifieer dat regel is bijgewerkt in lijst

### Test Scenario 2: Workdays Regel
1. ✅ Klik "Beschikbaarheid toevoegen"
2. ✅ Selecteer "Elke werkdag (maandag t/m vrijdag)"
3. ✅ Stel tijden in: 09:00 - 17:00
4. ✅ Klik toevoegen
5. ✅ Verifieer dat regel wordt getoond als "Elke werkdag (ma-vr)"

### Test Scenario 3: Edit Workdays Regel
1. ✅ Bewerk bestaande workdays regel
2. ✅ Wijzig tijden
3. ✅ Klik "Beschikbaarheid bijwerken"
4. ✅ Verifieer update

---

## Migratie Instructies

### Database Migratie Uitvoeren
```bash
node scripts/run-workdays-migration.js
```

### Rollback (indien nodig)
```sql
ALTER TABLE ihw.babs_recurring_rule 
  DROP CONSTRAINT IF EXISTS babs_recurring_rule_rule_type_check;

ALTER TABLE ihw.babs_recurring_rule 
  ADD CONSTRAINT babs_recurring_rule_rule_type_check 
  CHECK (rule_type IN ('weekly', 'biweekly', 'monthly_day', 'monthly_weekday'));
```

---

## Known Issues / Limitations
Geen bekende issues op dit moment.

---

## Future Enhancements
1. **Bulk edit**: Meerdere regels tegelijk bewerken
2. **Templates**: Opgeslagen beschikbaarheidspatronen
3. **Weekend rule**: Optie voor "Elk weekend (za-zo)"
4. **Custom days**: Flexibele selectie van specifieke dagen (bijv. ma, wo, vr)
5. **Copy rule**: Dupliceer bestaande regel naar andere periode

---

## Support
Voor vragen of problemen, zie:
- Backend API: `src/app/api/gemeente/babs/[babsId]/recurring-rules/`
- Frontend component: `src/app/gemeente/beheer/babs/[babsId]/calendar/page.tsx`
- Database schema: `src/db/schema.ts` (babsRecurringRule)

