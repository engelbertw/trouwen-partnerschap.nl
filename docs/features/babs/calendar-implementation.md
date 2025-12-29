# BABS Calendar Beschikbaarheid - Advanced Implementation

## 🎯 Overzicht

Deze geavanceerde implementatie biedt een volledige **calendar-based beschikbaarheidsbeheer** voor BABS met:

✅ **Visuele Calendar View** - React Big Calendar met maand/week/dag views  
✅ **Quick Block** - Snel datums blokkeren (vakantie, ziek)  
✅ **Recurring Rules** - Terugkerende patronen instellen  
✅ **Multiple Rule Types** - Wekelijks, om de week, maandelijks  
✅ **Time Slot Management** - Specifieke tijden per regel  
✅ **Visual Feedback** - Kleurgecodeerde events (groen=beschikbaar, rood=geblokkeerd)

## 📊 Database Schema

### Nieuwe Tabellen

#### 1. `ihw.babs_recurring_rule`

Terugkerende beschikbaarheidspatronen:

```sql
CREATE TABLE ihw.babs_recurring_rule (
  id uuid PRIMARY KEY,
  babs_id uuid REFERENCES ihw.babs(id),
  
  -- Rule configuration
  rule_type text CHECK (rule_type IN (
    'weekly',           -- Elke week op specifieke dag
    'biweekly',        -- Om de week
    'monthly_day',     -- Elke maand op dag X
    'monthly_weekday', -- Elke X-de weekdag van de maand
    'custom'           -- Custom RRULE
  )),
  
  -- Frequency parameters
  day_of_week integer,        -- 0-6 (zondag-zaterdag)
  day_of_month integer,       -- 1-31
  week_of_month integer,      -- 1-5 (1e, 2e, 3e, 4e, laatste)
  interval_weeks integer,     -- Voor biweekly
  
  -- Time slots
  start_time time NOT NULL,   -- 09:00
  end_time time NOT NULL,     -- 17:00
  
  -- Validity
  valid_from date NOT NULL,
  valid_until date,           -- NULL = onbeperkt
  
  -- Optional
  rrule_string text,          -- RFC 5545 format
  description text
);
```

**Voorbeelden:**

```sql
-- Elke maandag 09:00-17:00
INSERT INTO ihw.babs_recurring_rule VALUES (
  gen_random_uuid(),
  'babs-uuid',
  'weekly',
  1,  -- maandag
  NULL, NULL, NULL,
  '09:00', '17:00',
  '2024-01-01', NULL,
  NULL, 'Elke maandag'
);

-- Om de week op zaterdag 10:00-14:00
INSERT INTO ihw.babs_recurring_rule VALUES (
  gen_random_uuid(),
  'babs-uuid',
  'biweekly',
  6,  -- zaterdag
  NULL, NULL, 2,  -- om de 2 weken
  '10:00', '14:00',
  '2024-01-01', NULL,
  NULL, 'Om de week zaterdag'
);

-- Elke 2e zondag van de maand 10:00-12:00
INSERT INTO ihw.babs_recurring_rule VALUES (
  gen_random_uuid(),
  'babs-uuid',
  'monthly_weekday',
  0,  -- zondag
  NULL, 2,  -- 2e week
  NULL,
  '10:00', '12:00',
  '2024-01-01', NULL,
  NULL, 'Tweede zondag vd maand'
);
```

#### 2. `ihw.babs_blocked_date`

Geblokkeerde datums (vakantie, ziek, etc):

```sql
CREATE TABLE ihw.babs_blocked_date (
  id uuid PRIMARY KEY,
  babs_id uuid REFERENCES ihw.babs(id),
  
  -- Date blocking
  blocked_date date NOT NULL,
  all_day boolean DEFAULT true,
  start_time time,            -- Voor specifieke tijdslots
  end_time time,
  
  -- Context
  reason text,                -- "Vakantie", "Ziek"
  created_by text,
  created_at timestamptz
);
```

**Voorbeelden:**

```sql
-- Hele dag geblokkeerd
INSERT INTO ihw.babs_blocked_date VALUES (
  gen_random_uuid(),
  'babs-uuid',
  '2024-12-25',  -- Kerst
  true,
  NULL, NULL,
  'Kerstmis',
  'user-id',
  NOW()
);

-- Tijdslot geblokkeerd
INSERT INTO ihw.babs_blocked_date VALUES (
  gen_random_uuid(),
  'babs-uuid',
  '2024-01-15',
  false,
  '14:00', '17:00',
  'Doktersafspraak',
  'user-id',
  NOW()
);
```

### Database Function

`ihw.get_babs_available_slots(babs_id, date)` - Bereken beschikbare tijdslots voor een datum:

```sql
-- Gebruik
SELECT * FROM ihw.get_babs_available_slots(
  'babs-uuid', 
  '2024-01-15'::date
);
-- Result: start_time, end_time, source, rule_id
```

## 🎨 Frontend Components

### 1. BabsCalendar Component

Herbruikbare calendar component met React Big Calendar:

**Features:**
- 📅 Maand/Week/Dag/Agenda views
- 🇳🇱 Nederlandse lokalisatie
- 🎨 Kleurgecodeerde events
- 🖱️ Click & drag selectie
- 📱 Responsive design

**Props:**
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'available' | 'blocked' | 'booked';
  description?: string;
  allDay?: boolean;
}

<BabsCalendar
  events={events}
  onSelectSlot={(slot) => { /* User clicked date */ }}
  onSelectEvent={(event) => { /* User clicked event */ }}
/>
```

**Kleuren:**
- 🟢 **Groen** = Beschikbaar (available)
- 🔴 **Rood** = Geblokkeerd (blocked)
- 🟠 **Oranje** = Geboekt (booked)

### 2. Calendar Page (`/gemeente/beheer/babs/[babsId]/calendar`)

Volledige beschikbaarheids management interface:

**UI Elementen:**

```
┌────────────────────────────────────────────┐
│ 📅 Beschikbaarheid: Jan de Vries          │
├────────────────────────────────────────────┤
│ [🚫 Snel blokkeren] [➕ Regel toevoegen]  │
│                                            │
│ Legend: 🟢 Beschikbaar 🔴 Geblokkeerd     │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │       CALENDAR VIEW                   │  │
│ │   Ma Di Wo Do Vr Za Zo               │  │
│ │    1  2  3  4  5  6  7               │  │
│ │    🟢 🟢 🔴 🟢 🟢         │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Terugkerende regels      Geblokkeerde     │
│ ┌──────────────────┐    ┌──────────────┐  │
│ │ Elke maandag     │    │ 25 dec 2024  │  │
│ │ 09:00-17:00      │    │ Kerstmis     │  │
│ │ [✕]             │    │ [✕]          │  │
│ └──────────────────┘    └──────────────┘  │
└────────────────────────────────────────────┘
```

## 🔄 User Flows

### Flow 1: Quick Block (Snel Blokkeren)

```mermaid
User → Click "Snel blokkeren"
     → Selecteer datum in calendar (of click slot)
     → Vul reden in (optioneel)
     → Kies "hele dag" of tijdslot
     → Click "Blokkeren"
     → Date wordt rood in calendar
```

**API Call:**
```typescript
POST /api/gemeente/babs/[babsId]/blocked-dates
Body: {
  blockedDate: "2024-12-25",
  allDay: true,
  reason: "Vakantie"
}
```

### Flow 2: Recurring Rule (Terugkerende Regel)

```mermaid
User → Click "Regel toevoegen"
     → Kies regel type:
        - Wekelijks
        - Om de week
        - Maandelijks op datum
        - Maandelijks op weekdag
     → Configureer parameters (dag, tijd, etc)
     → Stel geldigheidsperiode in
     → Click "Regel toevoegen"
     → Groene events verschijnen in calendar
```

**Voorbeeld Wekelijkse Regel:**
```typescript
POST /api/gemeente/babs/[babsId]/recurring-rules
Body: {
  ruleType: "weekly",
  dayOfWeek: 1,  // Maandag
  startTime: "09:00",
  endTime: "17:00",
  validFrom: "2024-01-01",
  validUntil: null,  // Onbeperkt
  description: "Elke maandag beschikbaar"
}
```

### Flow 3: Deblokkeren

```mermaid
User → Click op rode event in calendar
     → Confirm dialog: "Blokkering verwijderen?"
     → Click "OK"
     → Event verdwijnt uit calendar
```

## 📋 Regel Types Uitgelegd

### 1. Weekly (Wekelijks)

**Configuratie:**
- Dag van de week (ma-zo)
- Starttijd & eindtijd
- Geldig vanaf/tot

**Voorbeeld:** "Elke maandag 09:00-17:00"

```json
{
  "ruleType": "weekly",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00"
}
```

### 2. Biweekly (Om de week)

**Configuratie:**
- Dag van de week
- Interval (elke X weken, meestal 2)
- Tijden

**Voorbeeld:** "Om de week op zaterdag 10:00-14:00"

```json
{
  "ruleType": "biweekly",
  "dayOfWeek": 6,
  "intervalWeeks": 2,
  "startTime": "10:00",
  "endTime": "14:00"
}
```

### 3. Monthly Day (Maandelijks op datum)

**Configuratie:**
- Dag van de maand (1-31)
- Tijden

**Voorbeeld:** "Elke 15e van de maand 09:00-12:00"

```json
{
  "ruleType": "monthly_day",
  "dayOfMonth": 15,
  "startTime": "09:00",
  "endTime": "12:00"
}
```

### 4. Monthly Weekday (Maandelijks op weekdag)

**Configuratie:**
- Week van de maand (1e, 2e, 3e, 4e, laatste)
- Dag van de week
- Tijden

**Voorbeeld:** "Elke 2e zondag van de maand 10:00-12:00"

```json
{
  "ruleType": "monthly_weekday",
  "weekOfMonth": 2,
  "dayOfWeek": 0,
  "startTime": "10:00",
  "endTime": "12:00"
}
```

## 🔌 API Endpoints

### Recurring Rules

#### GET `/api/gemeente/babs/[babsId]/recurring-rules`
Haal alle regels op voor een BABS.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "babsId": "uuid",
      "ruleType": "weekly",
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00",
      "validFrom": "2024-01-01",
      "validUntil": null,
      "description": "Elke maandag"
    }
  ]
}
```

#### POST `/api/gemeente/babs/[babsId]/recurring-rules`
Maak nieuwe regel aan.

**Body:** Zie regel types hierboven.

#### DELETE `/api/gemeente/babs/[babsId]/recurring-rules/[ruleId]`
Verwijder een regel.

### Blocked Dates

#### GET `/api/gemeente/babs/[babsId]/blocked-dates`
Haal geblokkeerde datums op (optioneel met date range filter).

**Query params:**
- `startDate` (optioneel): Filter vanaf datum
- `endDate` (optioneel): Filter tot datum

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "babsId": "uuid",
      "blockedDate": "2024-12-25",
      "allDay": true,
      "reason": "Kerstmis",
      "createdBy": "user-id"
    }
  ]
}
```

#### POST `/api/gemeente/babs/[babsId]/blocked-dates`
Blokkeer een datum.

**Body:**
```json
{
  "blockedDate": "2024-12-25",
  "allDay": true,
  "startTime": "09:00",  // Optioneel, vereist als allDay=false
  "endTime": "17:00",    // Optioneel, vereist als allDay=false
  "reason": "Vakantie"   // Optioneel
}
```

#### DELETE `/api/gemeente/babs/[babsId]/blocked-dates/[blockId]`
Deblokkeer een datum.

## 🚀 Deployment

### Stap 1: Database Migration

```bash
cd sql/migrations
psql $DATABASE_URL -f 091_babs_calendar_beschikbaarheid.sql
```

### Stap 2: NPM Packages

```bash
npm install react-big-calendar --legacy-peer-deps
# date-fns is already installed
```

### Stap 3: Code Deploy

Push alle wijzigingen:
- `src/components/BabsCalendar.tsx` - Calendar component
- `src/app/gemeente/beheer/babs/[babsId]/calendar/page.tsx` - Main page
- `src/app/api/gemeente/babs/[babsId]/*` - API routes
- `src/db/schema.ts` - Database types

### Stap 4: Test

1. Log in als gemeente admin
2. Ga naar "Beheer" → "Standaard tabellen" → "BABS"
3. Click op "📅 Agenda" bij een BABS
4. Test Quick Block
5. Test Regel toevoegen
6. Verify calendar updates

## 🎓 Advanced Gebruik

### Scenario 1: BABS Werkt Deeltijd

**Setup:**
- Regel 1: Maandag 09:00-13:00 (ochtend)
- Regel 2: Woensdag 14:00-18:00 (middag)
- Regel 3: Vrijdag 09:00-17:00 (hele dag)

### Scenario 2: BABS Werkt Wisselende Uren

**Setup:**
- Regel 1: Elke 1e en 3e zaterdag van de maand 10:00-14:00
- Blokkering: Hele maand augustus (vakantie)

### Scenario 3: Noodsituatie Blokkeren

**Quick Block:**
1. Click "Snel blokkeren"
2. Selecteer vandaag
3. Reden: "Ziek"
4. Click "Blokkeren"
→ Direct niet meer beschikbaar

## 📊 Performance Optimizations

### Database Indexes

```sql
-- Snel opzoeken van regels per BABS
CREATE INDEX idx_babs_recurring_rule_babs_id 
  ON ihw.babs_recurring_rule(babs_id);

-- Snel filteren op geldigheid
CREATE INDEX idx_babs_recurring_rule_validity 
  ON ihw.babs_recurring_rule(valid_from, valid_until);

-- Snel opzoeken van blokkades
CREATE INDEX idx_babs_blocked_date_lookup 
  ON ihw.babs_blocked_date(babs_id, blocked_date);
```

### Frontend Optimizations

- Events worden gecached in state
- Calendar re-renders alleen bij data wijzigingen
- Lazy loading van modals
- Debounced search (indien toegevoegd)

## 🔮 Toekomstige Uitbreidingen

### 1. BABS Zelf Beschikbaarheid Beheren

Voeg toe aan `/babs/beschikbaarheid`:
- Eigen calendar view
- Quick block eigen datums
- View van boekingen

### 2. Capacity Management

Track aantal ceremonies per tijdslot:
```sql
ALTER TABLE ihw.babs_recurring_rule 
  ADD COLUMN max_ceremonies integer DEFAULT 1;
```

### 3. Auto-Assignment

Automatisch BABS toewijzen op basis van:
- Beschikbaarheid
- Werkdruk (minder ceremonies = hogere prioriteit)
- Voorkeuren

### 4. Conflict Detection

Waarschuw bij:
- Overlappende ceremonies
- Dubbele boekingen
- Te weinig tijd tussen ceremonies

### 5. Export/Import

- Export beschikbaarheid naar iCal
- Import from Google Calendar
- Sync met externe systemen

## 🐛 Troubleshooting

### Calendar Niet Zichtbaar

**Probleem:** Witte pagina, calendar laadt niet

**Oplossing:**
1. Check console voor errors
2. Verify `react-big-calendar` installed
3. Check CSS import in component
4. Verify date-fns functions

### Events Niet Zichtbaar

**Probleem:** Calendar toont geen events

**Oplossing:**
1. Check API response in Network tab
2. Verify `buildCalendarEvents` logic
3. Check date parsing (parseISO)
4. Verify event format matches CalendarEvent type

### Regel Niet Werkend

**Probleem:** Regel aangemaakt maar events verschijnen niet

**Oplossing:**
1. Check `valid_from` datum (moet in verleden zijn)
2. Verify `day_of_week` correct (0=zondag)
3. Check database function `get_babs_available_slots`
4. Test query direct in database

## 📞 Support

Voor vragen:
- Check deze documentatie
- Review code in `src/app/gemeente/beheer/babs/[babsId]/calendar/`
- Check API endpoints in `src/app/api/gemeente/babs/`
- Database schema in `sql/migrations/091_babs_calendar_beschikbaarheid.sql`

## ✅ Checklist Deployment

- [ ] Run database migration 091
- [ ] Install react-big-calendar
- [ ] Deploy code changes
- [ ] Test Quick Block
- [ ] Test Weekly rule
- [ ] Test Biweekly rule
- [ ] Test Monthly rules
- [ ] Test Delete rule
- [ ] Test Unblock date
- [ ] Verify calendar views (month/week/day)
- [ ] Check mobile responsive
- [ ] Test with multiple BABS
- [ ] Verify permissions (only admin)

