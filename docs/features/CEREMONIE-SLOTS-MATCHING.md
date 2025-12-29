# Ceremonie Slots Matching - Feature Documentatie

## Overzicht

Dit feature maakt het mogelijk om automatisch beschikbare tijdslots te vinden waarbij zowel een BABS als een locatie beschikbaar zijn voor een specifieke ceremonie duur.

## Database Schema

### Type Ceremonie - Tijdsduur

De `type_ceremonie` tabel heeft nu een `duur_minuten` veld:

```sql
ALTER TABLE ihw.type_ceremonie 
  ADD COLUMN duur_minuten integer DEFAULT 60;

-- Constraint: tussen 15 en 480 minuten
ALTER TABLE ihw.type_ceremonie
  ADD CONSTRAINT chk_duur_minuten CHECK (duur_minuten > 0 AND duur_minuten <= 480);
```

### Database Functie

De functie `ihw.find_available_ceremony_slots()` vindt beschikbare slots:

```sql
SELECT * FROM ihw.find_available_ceremony_slots(
  p_locatie_id uuid,      -- Locatie ID
  p_babs_id uuid,          -- BABS ID
  p_duur_minuten integer, -- Duur in minuten (bijv. 60 voor 1 uur)
  p_start_date date,      -- Start datum (bijv. vandaag)
  p_end_date date         -- Eind datum (bijv. 3 maanden vanaf nu)
);
```

**Returns:**
- `datum`: Beschikbare datum
- `start_tijd`: Start tijd
- `eind_tijd`: Eind tijd (start + duur)
- `locatie_naam`: Naam van de locatie
- `babs_naam`: Naam van de BABS

## API Endpoint

### GET /api/ceremonie/beschikbare-slots

**Query Parameters:**
- `locatieId` (required): UUID van de locatie
- `babsId` (required): UUID van de BABS
- `duurMinuten` (optional): Duur in minuten (default: 60)
- `startDate` (optional): Start datum YYYY-MM-DD (default: vandaag)
- `endDate` (optional): Eind datum YYYY-MM-DD (default: 3 maanden vanaf nu)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "datum": "2025-01-15",
      "start_tijd": "14:00:00",
      "eind_tijd": "15:00:00",
      "locatie_naam": "Stadhuis Centrum",
      "babs_naam": "Jan Jansen"
    }
  ],
  "count": 1
}
```

**Example:**
```typescript
const response = await fetch(
  `/api/ceremonie/beschikbare-slots?` +
  `locatieId=${locatieId}&` +
  `babsId=${babsId}&` +
  `duurMinuten=${typeCeremonie.duurMinuten}&` +
  `startDate=${format(new Date(), 'yyyy-MM-dd')}&` +
  `endDate=${format(addMonths(new Date(), 3), 'yyyy-MM-dd')}`
);
const result = await response.json();
```

## Gebruik in Frontend

### Stap 1: Type Ceremonie Ophalen

```typescript
// Haal type ceremonie op om duurMinuten te krijgen
const typeCeremonieResponse = await fetch(`/api/gemeente/lookup/type-ceremonie`);
const typeCeremonieData = await typeCeremonieResponse.json();
const selectedType = typeCeremonieData.data.find(t => t.id === selectedTypeId);
const duurMinuten = selectedType?.duurMinuten || 60;
```

### Stap 2: Beschikbare Slots Ophalen

```typescript
// Wanneer zowel locatie als BABS zijn gekozen
useEffect(() => {
  if (selectedLocatieId && selectedBabsId && selectedTypeCeremonieId) {
    fetchAvailableSlots();
  }
}, [selectedLocatieId, selectedBabsId, selectedTypeCeremonieId]);

const fetchAvailableSlots = async () => {
  setIsLoadingSlots(true);
  try {
    const response = await fetch(
      `/api/ceremonie/beschikbare-slots?` +
      `locatieId=${selectedLocatieId}&` +
      `babsId=${selectedBabsId}&` +
      `duurMinuten=${duurMinuten}&` +
      `startDate=${format(new Date(), 'yyyy-MM-dd')}&` +
      `endDate=${format(addMonths(new Date(), 3), 'yyyy-MM-dd')}`
    );
    
    const result = await response.json();
    if (result.success) {
      setAvailableSlots(result.data);
    } else {
      setError(result.error);
    }
  } catch (err) {
    console.error('Error fetching slots:', err);
    setError('Er ging iets mis bij het ophalen van beschikbare slots');
  } finally {
    setIsLoadingSlots(false);
  }
};
```

### Stap 3: Slots Tonen in UI

```typescript
{isLoadingSlots ? (
  <div className="text-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    <p className="text-sm text-gray-600 mt-2">Beschikbare slots ophalen...</p>
  </div>
) : availableSlots.length > 0 ? (
  <div className="grid grid-cols-1 gap-3">
    {availableSlots.map((slot, idx) => (
      <button
        key={idx}
        onClick={() => handleSelectSlot(slot)}
        className="text-left p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all"
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-900">
              {format(parseISO(slot.datum), 'EEEE d MMMM yyyy', { locale: nl })}
            </p>
            <p className="text-sm text-gray-600">
              {slot.start_tijd.substring(0, 5)} - {slot.eind_tijd.substring(0, 5)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{slot.locatie_naam}</p>
            <p className="text-xs text-gray-500">{slot.babs_naam}</p>
          </div>
        </div>
      </button>
    ))}
  </div>
) : (
  <div className="text-center py-8 text-gray-500">
    <p>Geen beschikbare slots gevonden voor deze combinatie.</p>
    <p className="text-sm mt-2">Probeer een andere locatie, BABS of datum range.</p>
  </div>
)}
```

## Integratie in Ceremonie Flow

### Aanbevolen Flow:

1. **Soort Ceremonie** (`/dossier/[id]/ceremonie/soort`)
   - Gebruiker kiest type ceremonie
   - Duur wordt opgeslagen: `typeCeremonie.duurMinuten`

2. **Locatie & BABS** (`/dossier/[id]/ceremonie/keuze`)
   - Gebruiker kiest locatie
   - Gebruiker kiest BABS
   - **Automatisch**: Beschikbare slots worden opgehaald op basis van `duurMinuten`

3. **Datum & Tijd** (`/dossier/[id]/ceremonie/datum`)
   - Toon beschikbare slots uit stap 2
   - Gebruiker selecteert slot
   - Of gebruiker kiest handmatig datum/tijd (met validatie)

## Validatie

Wanneer een gebruiker handmatig een datum/tijd kiest, valideer:

1. **Locatie beschikbaarheid**: Check `ihw.get_locatie_available_slots()`
2. **BABS beschikbaarheid**: Check `ihw.get_babs_available_slots()`
3. **Duur past**: Check of `start_tijd + duur_minuten <= end_tijd` (binnen beschikbare slot)
4. **Geen overlap**: Check of er geen andere ceremonie is op hetzelfde tijdstip

## Voorbeeld Validatie Code

```typescript
const validateCeremonieSlot = async (
  locatieId: string,
  babsId: string,
  datum: string,
  startTijd: string,
  duurMinuten: number
) => {
  // Bereken eind tijd
  const [hours, minutes] = startTijd.split(':').map(Number);
  const start = new Date(`${datum}T${startTijd}`);
  const end = new Date(start.getTime() + duurMinuten * 60000);
  const eindTijd = format(end, 'HH:mm');

  // Check locatie beschikbaarheid
  const locatieSlots = await fetch(
    `/api/gemeente/locaties/${locatieId}/available-slots?datum=${datum}`
  );
  const locatieData = await locatieSlots.json();
  const locatieAvailable = locatieData.data.some(
    (slot: any) => slot.start_time <= startTijd && slot.end_time >= eindTijd
  );

  // Check BABS beschikbaarheid
  const babsSlots = await fetch(
    `/api/gemeente/babs/${babsId}/available-slots?datum=${datum}`
  );
  const babsData = await babsSlots.json();
  const babsAvailable = babsData.data.some(
    (slot: any) => slot.start_time <= startTijd && slot.end_time >= eindTijd
  );

  return locatieAvailable && babsAvailable;
};
```

## Migraties

De volgende migraties zijn uitgevoerd:

1. **096_add_duur_minuten_type_ceremonie.sql**: Voegt `duur_minuten` toe aan `type_ceremonie`
2. **097_find_available_ceremony_slots.sql**: Maakt de matching functie

## Status

✅ Database schema uitgebreid
✅ TypeScript schema bijgewerkt
✅ Frontend formulier uitgebreid
✅ Database functie geïmplementeerd
✅ API endpoint gemaakt
⏳ Frontend integratie in ceremonie flow (volgende stap)

