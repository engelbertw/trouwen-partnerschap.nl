# Clerk Gemeente Setup - Handleiding

## Overzicht

Om een gebruiker toegang te geven tot de gemeente beheerpagina's, moet je de gemeente metadata toevoegen aan de gebruiker in Clerk.

## Stap 1: Clerk Dashboard

1. Ga naar [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecteer je applicatie
3. Ga naar **"Users"** in het menu
4. Selecteer de gebruiker die je wilt configureren
5. Scroll naar **"Public metadata"** sectie
6. Klik op **"Edit"** of **"Add metadata"**

## Stap 2: Voeg Gemeente Metadata Toe

**Alleen `gemeente_oin` is verplicht!** Voeg de volgende JSON toe aan **Public metadata**:

```json
{
  "gemeente_oin": "00000001002564440000"
}
```

**Optioneel (wordt automatisch opgehaald of gebruikt default):**
- `gemeente_naam`: Wordt automatisch uit database opgehaald op basis van OIN
- `rol`: Default is `loket_medewerker` als niet ingesteld

### Gemeente OIN Codes

| Gemeente | OIN | Code |
|----------|-----|------|
| Amsterdam | `00000001002564440000` | 0363 |
| Rotterdam | `00000001003214345000` | 0599 |
| Den Haag | `00000001003609205000` | 0518 |
| Utrecht | `00000001002220647000` | 0344 |

### Rollen

- **`loket_medewerker`** - Standaard rol, kan alles beheren
- **`loket_readonly`** - Alleen lezen, geen wijzigingen
- **`hb_admin`** - Beheerder niveau
- **`system_admin`** - Systeembeheerder (toegang tot `/admin/gebruikers`)

## Stap 3: Verificatie

Test of de configuratie werkt:

```bash
# Vervang USER_ID met je Clerk user ID
npm run verify:user USER_ID
```

Of test handmatig:
1. Log in met de gebruiker
2. Ga naar `/gemeente/beheer`
3. Je zou nu de aankondigingen werklijst moeten zien

## Stap 4: Via Admin Pagina (Alternatief)

Als je al een system admin hebt:

1. Log in als system admin
2. Ga naar `/admin/gebruikers`
3. Klik op "Bewerken" bij een gebruiker
4. Selecteer gemeente en rol
5. Klik "Opslaan"

## Troubleshooting

### "Geen gemeente toegewezen aan gebruiker"
- Controleer of `gemeente_oin` is ingesteld in Clerk Dashboard
- Controleer of het in **Public metadata** staat (niet Private metadata)

### "Ongeldige gemeente configuratie"
- Controleer of OIN exact 20 cijfers is
- Controleer of er geen spaties of speciale tekens zijn

### "Alleen systeembeheerders hebben toegang"
- Controleer of de rol `system_admin` is voor admin pagina's
- Voor gemeente beheer: `loket_medewerker` of `hb_admin` is voldoende

## Belangrijk

- **OIN formaat**: Exact 20 cijfers (bijv. `00000001002564440000`)
- **Public metadata**: Gebruik `publicMetadata`, niet `privateMetadata`
- **Gemeente moet bestaan**: De gemeente moet in de database staan (`ihw.gemeente` tabel)

## Database Check

Controleer of de gemeente in de database staat:

```sql
SELECT * FROM ihw.gemeente WHERE oin = '00000001002564440000';
```

Als de gemeente niet bestaat, voeg deze toe:

```sql
INSERT INTO ihw.gemeente (oin, naam, gemeente_code) 
VALUES ('00000001002564440000', 'Amsterdam', '0363')
ON CONFLICT (oin) DO NOTHING;
```

