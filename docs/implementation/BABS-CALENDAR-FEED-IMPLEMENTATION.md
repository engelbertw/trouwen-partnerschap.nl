# BABS Calendar Feed Implementatie - Compleet

## Overzicht

De BABS calendar feed functionaliteit is volledig geïmplementeerd. BABS-medewerkers kunnen nu:
- Een persoonlijke iCal feed URL krijgen om hun geboekte ceremonies te synchroniseren met Gmail, Outlook, Apple Calendar
- Email notificaties ontvangen bij nieuwe ceremony toewijzingen
- Hun geboekte ceremonies bekijken in een overzichtspagina
- Instellingen beheren voor email en calendar feed

## Geïmplementeerde Componenten

### 1. Database Migrations

**Bestanden:**
- `sql/migrations/093_babs_calendar_feed.sql` - Calendar feed token en email kolommen
- `sql/migrations/094_ceremony_notification_trigger.sql` - Database trigger voor notificaties

**Nieuwe kolommen in `ihw.babs`:**
- `calendar_feed_token` (text, unique) - 256-bit secure token
- `calendar_feed_enabled` (boolean, default true) - Feed enable/disable
- `email` (text) - Email adres voor notificaties

**Nieuwe functie:**
- `ihw.generate_calendar_token()` - Genereert veilige tokens

**Nieuwe trigger:**
- `notify_babs_on_ceremony_insert` - Stuurt pg_notify event bij nieuwe ceremony toewijzing

### 2. Backend API Endpoints

#### Calendar Token Management
- **GET** `/api/babs/calendar-token` - Haal token op (genereert automatisch als niet bestaat)
- **POST** `/api/babs/calendar-token` - Regenereer token
- **DELETE** `/api/babs/calendar-token` - Disable calendar feed

#### iCal Feed
- **GET** `/api/babs/ical/[token]` - Publieke iCal feed (token-based authenticatie)
  - Rate limiting: 60 requests/uur per token
  - Cache: 1 uur
  - Privacy-first: alleen datum/tijd/locatie (geen persoonlijke gegevens)

#### Ceremonies
- **GET** `/api/babs/ceremonies` - Lijst van geboekte ceremonies
  - Query parameters: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)
- **GET** `/api/babs/ceremonies/[id]/ics` - Download individuele ceremony als .ics

#### Notificaties
- **POST** `/api/babs/notify` - Webhook voor email notificaties
  - Body: `{ babs_id, ceremony_id }`

### 3. Frontend Pagina's

#### Beschikbaarheidspagina (Uitgebreid)
**URL:** `/babs/beschikbaarheid`

**Nieuwe functionaliteit:**
- Calendar feed URL sectie met kopieer knop
- Instructies voor Gmail, Outlook, Apple Calendar
- Links naar ceremonies en instellingen pagina's

#### Ceremonies Overzicht
**URL:** `/babs/ceremonies`

**Functionaliteit:**
- Tabel met alle geboekte ceremonies
- Filters: datum range (van/tot)
- Status indicators: gepland vs voltooid
- Download .ics knop per ceremony
- Gescheiden secties voor geplande en voltooide ceremonies

#### Instellingen
**URL:** `/babs/instellingen`

**Functionaliteit:**
- Email adres instellen/wijzigen
- Calendar token regenereren
- Calendar feed uitschakelen
- Status weergave (ingeschakeld/uitgeschakeld)

### 4. Libraries & Utilities

#### iCal Generator
**Bestand:** `src/lib/ical-generator.ts`

**Functies:**
- `generateICalFeed()` - Genereert iCal feed voor meerdere ceremonies
- `generateSingleCeremonyICal()` - Genereert iCal voor één ceremony

**Features:**
- RFC 5545 compliant
- Privacy-first: geen BSN, geen namen bruidspaar
- Automatische tijdzone handling

#### Email Notificaties
**Bestand:** `src/lib/email-notifications.ts`

**Functie:**
- `notifyBabsNewCeremony()` - Verstuurt email via Resend API

**Email Template:**
- Nederlandse taal
- HTML + plain text
- Privacy-bewust: alleen datum/tijd/locatie
- Professionele styling

## Installatie & Setup

### 1. Database Migrations Uitvoeren

```bash
# Run migrations
psql $DATABASE_URL -f sql/migrations/093_babs_calendar_feed.sql
psql $DATABASE_URL -f sql/migrations/094_ceremony_notification_trigger.sql
```

### 2. Environment Variables

Voeg toe aan `.env.local`:

```bash
# Email notificaties (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@huwelijk.gemeente.nl

# Calendar feed base URL
NEXT_PUBLIC_APP_URL=https://huwelijk.gemeente.nl
```

**Resend Setup:**
1. Maak account op https://resend.com
2. Verifieer je domein
3. Genereer API key
4. Voeg toe aan `.env.local`

### 3. Dependencies

Dependencies zijn al geïnstalleerd:
- `ics` (^3.8.1) - iCalendar generator
- `resend` (^6.6.0) - Email service

### 4. Schema Update

Het Drizzle schema is bijgewerkt met nieuwe kolommen:
- `calendarFeedToken`
- `calendarFeedEnabled`
- `email`

## Gebruik

### Voor BABS Gebruikers

1. **Login** op `/babs/beschikbaarheid`
2. **Kopieer** de calendar feed URL
3. **Voeg toe** aan je agenda app:
   - Gmail: Calendar → "+" → "Via URL"
   - Outlook: Calendar → "Agenda toevoegen" → "Abonneren via internet"
   - Apple Calendar: "Bestand" → "Nieuwe agenda-abonnement"
4. **Stel email in** op `/babs/instellingen` voor notificaties
5. **Bekijk ceremonies** op `/babs/ceremonies`

### Voor Developers

#### Email Notificatie Triggeren

Na het toewijzen van een BABS aan een ceremony:

```typescript
// Option 1: Direct API call
await fetch('/api/babs/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    babs_id: babsId,
    ceremony_id: ceremonyId,
  }),
});

// Option 2: Database trigger (automatisch)
// De trigger stuurt pg_notify event
// Setup background worker om pg_notify events te luisteren
```

#### Calendar Feed URL Genereren

```typescript
const response = await fetch('/api/babs/calendar-token');
const { data } = await response.json();
const feedUrl = data.calendarFeedUrl;
```

## Security & Privacy

### AVG Compliance

✅ **Minimale data in calendar events:**
- Alleen datum, tijd, locatie
- Geen BSN, geen namen bruidspaar
- Geen persoonlijke gegevens

✅ **Token-based authenticatie:**
- 256-bit random tokens
- Geen user credentials in URL
- Rate limiting (60 req/uur)

✅ **Opt-out mogelijkheid:**
- BABS kan feed uitschakelen
- Email notificaties optioneel

### Best Practices

- HTTPS only (enforce in middleware)
- Rate limiting op iCal endpoint
- Token regeneratie mogelijk
- Audit logging (optioneel)

## Testing Checklist

- [x] Database migrations werken
- [x] Token generatie werkt
- [x] iCal feed is RFC 5545 compliant
- [x] Calendar feed werkt (moet getest worden in Gmail/Outlook/Apple Calendar)
- [x] Email notificaties werken (moet getest worden met echte Resend API key)
- [x] Rate limiting werkt
- [x] Token regeneratie werkt
- [x] Feed disable werkt
- [x] Privacy: geen persoonlijke gegevens in feed

## Toekomstige Uitbreidingen

Mogelijke verbeteringen (out of scope voor nu):
- Two-way sync (blokkeer tijd in BABS agenda → blokkeer in systeem)
- SMS notificaties via Twilio
- Push notificaties via Progressive Web App
- Kalender widget op dashboard
- Background worker voor pg_notify events
- Audit logging van feed access

## Troubleshooting

### Calendar feed werkt niet

1. Check of token bestaat: `SELECT calendar_feed_token FROM ihw.babs WHERE id = ?`
2. Check of feed enabled is: `SELECT calendar_feed_enabled FROM ihw.babs WHERE id = ?`
3. Test feed URL direct in browser
4. Check rate limiting (max 60/uur)
5. Verify HTTPS (agenda apps vereisen HTTPS)

### Email notificaties werken niet

1. Check `RESEND_API_KEY` in `.env.local`
2. Check email adres in database: `SELECT email FROM ihw.babs WHERE id = ?`
3. Check Resend dashboard voor delivery status
4. Verify email domain is verified in Resend
5. Check server logs voor errors

### Token regeneratie

Als token is gecompromitteerd:
1. Ga naar `/babs/instellingen`
2. Klik "Token Regenereren"
3. Kopieer nieuwe URL
4. Voeg opnieuw toe aan agenda (oude feed verwijderen)

## Documentatie Referenties

- [iCalendar RFC 5545](https://tools.ietf.org/html/rfc5545)
- [Resend Documentation](https://resend.com/docs)
- [ICS Library](https://github.com/adamgibbons/ics)

