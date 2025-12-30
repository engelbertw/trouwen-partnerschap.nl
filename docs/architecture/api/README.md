# API Documentatie

**Laatst bijgewerkt:** 28 december 2025

## Overzicht

Deze documentatie beschrijft alle API endpoints in de Huwelijk applicatie.

## API Endpoints

### Dossier Management

#### Dossier Aanmaken
- **POST** `/api/dossier/create` - Maakt een nieuw dossier aan

#### Dossier Operaties
- **GET** `/api/dossier/[id]` - Haalt dossier op
- **PUT** `/api/dossier/[id]/partners` - Update partner informatie
- **GET** `/api/dossier/[id]/aankondiging` - Haalt aankondiging type op
- **PUT** `/api/dossier/[id]/aankondiging` - Update aankondiging type
- **GET** `/api/dossier/[id]/kinderen` - Haalt kinderen op
- **PUT** `/api/dossier/[id]/kinderen` - Update kinderen
- **PUT** `/api/dossier/[id]/curatele` - Update curatele status
- **PUT** `/api/dossier/[id]/bloedverwantschap` - Update bloedverwantschap
- **GET** `/api/dossier/[id]/samenvatting` - Haalt samenvatting op

### Ceremonie

- **PUT** `/api/dossier/[id]/ceremonie/type` - Update ceremonie type
- **PUT** `/api/dossier/[id]/ceremonie/locatie` - Update locatie
- **PUT** `/api/dossier/[id]/ceremonie/datum-tijd` - Update datum/tijd
- **PUT** `/api/dossier/[id]/ceremonie/babs` - Update BABS
- **PUT** `/api/dossier/[id]/ceremonie/taal` - Update taal
- **PUT** `/api/dossier/[id]/ceremonie/wensen` - Update wensen
- **GET** `/api/ceremonie/beschikbare-babs` - Haalt beschikbare BABS op
- **GET** `/api/ceremonie/beschikbare-slots` - Haalt beschikbare slots op

### Documenten

- **GET** `/api/dossier/[id]/documenten` - Haalt document selecties op
- **POST** `/api/dossier/[id]/documenten` - Update document selecties
- **DELETE** `/api/dossier/[id]/documenten` - Verwijder document selecties

### Getuigen

- **GET** `/api/dossier/[id]/getuigen` - Haalt getuigen op
- **POST** `/api/dossier/[id]/getuigen` - Update getuigen

### Naamgebruik

- **GET** `/api/dossier/[id]/naamgebruik` - Haalt naamgebruik op
- **PUT** `/api/dossier/[id]/naamgebruik` - Update naamgebruik

### Validatie

- **POST** `/api/validate` - Valideer data (kind, partner, huwelijksdatum, document)

### BABS Beheer

- **GET** `/api/babs/ceremonies` - Haalt ceremonies op
- **GET** `/api/babs/[id]` - Haalt BABS details op
- **GET** `/api/babs/beschikbaarheid` - Haalt beschikbaarheid op
- **GET** `/api/babs/ical/[token]` - iCal feed voor BABS calendar
- **GET** `/api/babs/calendar-token` - Genereer calendar token

### Gemeente Beheer

- **GET** `/api/gemeente/list` - Lijst van gemeenten
- **GET** `/api/gemeente/aankondigingen` - Lijst aankondigingen
- **POST** `/api/gemeente/aankondigingen/[id]/goedkeuren` - Goedkeur aankondiging
- **POST** `/api/gemeente/aankondigingen/[id]/afkeuren` - Afkeur aankondiging

### BAG API

- **GET** `/api/bag/postcode` - Adres validatie via BAG API

### Admin

- **GET** `/api/admin/users` - Lijst gebruikers
- **POST** `/api/admin/users/create` - Maak gebruiker aan
- **GET** `/api/admin/users/[id]` - Haalt gebruiker op

## Authenticatie

Alle API endpoints (behalve publieke endpoints) vereisen Clerk authenticatie. De authenticatie wordt afgehandeld via middleware.

## Multi-tenancy

Alle endpoints respecteren multi-tenancy via `gemeenteOin`. Data wordt automatisch gefilterd op basis van de gebruiker's gemeente.

## Validatie

Zie [Validation System](../VALIDATION-SYSTEM.md) voor uitgebreide validatie documentatie.

## Gerelateerde Documentatie

- [Database](../database/README.md) - Database schema
- [Features](../features/README.md) - Feature implementaties
- [Validation System](../VALIDATION-SYSTEM.md) - Validatie regels

