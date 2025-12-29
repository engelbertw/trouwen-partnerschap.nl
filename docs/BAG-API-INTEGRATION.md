# BAG API Integratie

Deze applicatie integreert met de BAG API (Basisregistratie Adressen en Gebouwen) van het Kadaster om automatisch adresgegevens op te halen op basis van postcode.

## Configuratie

### 1. BAG API Key verkrijgen

1. Ga naar [Kadaster BAG API](https://www.kadaster.nl/zakelijk/producten/bag-api)
2. Registreer je voor een BAG API account
3. Vraag een API key aan via het Kadaster portaal

### 2. Environment Variabele toevoegen

Voeg de volgende regel toe aan je `.env` bestand:

```env
BAG_API_KEY=je_bag_api_key_hier
```

**Belangrijk:** Zorg ervoor dat `.env` in je `.gitignore` staat om de API key niet te committen.

## Functionaliteit

### Automatisch adres ophalen

Wanneer een gebruiker een postcode invult in het Partner 1 of Partner 2 formulier:

1. **Postcode validatie**: De postcode wordt gevalideerd (formaat: 1234AB)
2. **Automatische API call**: Zodra een geldige postcode van 6 karakters is ingevuld, wordt automatisch de BAG API aangeroepen
3. **Auto-fill velden**: De volgende velden worden automatisch ingevuld:
   - **Straatnaam** (adres veld)
   - **Woonplaats** (plaats veld)
   - **Postcode** (genormaliseerd: zonder spaties, hoofdletters)

### Wanneer wordt de API aangeroepen?

- **Bij input**: Wanneer de gebruiker een complete postcode van 6 karakters intypt
- **Bij blur**: Wanneer de gebruiker het postcode veld verlaat (onBlur event)

### API Endpoint

De applicatie gebruikt een interne API route die als proxy fungeert:

```
GET /api/bag/postcode?postcode=1234AB&huisnummer=12
```

**Parameters:**
- `postcode` (verplicht): Nederlandse postcode in formaat 1234AB
- `huisnummer` (optioneel): Huisnummer voor specifiek adres

**Response:**
```json
{
  "success": true,
  "data": {
    "straatnaam": "Kerkstraat",
    "huisnummer": "12",
    "woonplaats": "Amsterdam",
    "postcode": "1234AB"
  }
}
```

## Implementatie Details

### Frontend (Partner formulieren)

**Locatie:** 
- `src/app/000-aankondiging/021-partner1-gegevens/page.tsx`
- `src/app/000-aankondiging/031-partner2-gegevens/page.tsx`

**Functie:** `handlePostcodeChange()`
- Valideert postcode formaat
- Roept `/api/bag/postcode` aan
- Vult automatisch adresvelden in

### Backend (API Route)

**Locatie:** `src/app/api/bag/postcode/route.ts`

**Functies:**
- Valideert postcode formaat
- Haalt BAG API key op uit environment variabelen
- Roept BAG API aan met correcte headers
- Parseert BAG API response
- Retourneert gestructureerde adresgegevens

## BAG API Documentatie

Voor de meest actuele documentatie, zie:
- [BAG API Technische Specificatie](https://github.com/lvbag/BAG-API/tree/master/Technische%20specificatie)
- [Kadaster BAG API](https://www.kadaster.nl/zakelijk/producten/bag-api)

## Troubleshooting

### "BAG API configuratie ontbreekt"
- Controleer of `BAG_API_KEY` is ingesteld in `.env`
- Herstart de development server na het toevoegen van de variabele

### "Postcode niet gevonden"
- Controleer of de postcode correct is ingevuld (1234AB formaat)
- Controleer of de postcode bestaat in de BAG database
- Controleer of je BAG API key geldig is en toegang heeft tot de juiste endpoints

### "Fout bij ophalen adresgegevens"
- Controleer de BAG API endpoint URL in `src/app/api/bag/postcode/route.ts`
- Controleer of de authenticatie header correct is (kan `X-Api-Key`, `Authorization: Bearer`, etc. zijn)
- Bekijk de server logs voor gedetailleerde foutmeldingen

### Response structuur wijkt af
De BAG API kan verschillende response structuren hebben afhankelijk van de versie. Pas de parser in `src/app/api/bag/postcode/route.ts` aan op basis van de daadwerkelijke BAG API response structuur.

## Aanpassen voor andere BAG API versies

Als je een andere BAG API versie gebruikt, pas dan aan in `src/app/api/bag/postcode/route.ts`:

1. **Endpoint URL**: Pas `bagApiUrl` aan naar je BAG API versie
2. **Authenticatie**: Controleer de juiste header naam en formaat
3. **Response parsing**: Pas de parser aan op basis van de daadwerkelijke response structuur

## Veiligheid

- ✅ API key wordt alleen server-side gebruikt (nooit exposed naar client)
- ✅ API key staat in `.env` (niet in versiebeheer)
- ✅ Postcode wordt gevalideerd voordat API call wordt gemaakt
- ✅ Foutmeldingen bevatten geen gevoelige informatie in productie

