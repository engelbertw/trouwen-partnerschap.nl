# Getuigen Flow - Visual Guide

## 📱 User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                     Dossier Overview                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Openstaande acties:                                  │  │
│  │  ✓ Plan jullie ceremonie                             │  │
│  │  → Geef jullie getuigen door          [Click here]   │  │
│  │  ○ Kies welke documenten jullie willen ontvangen     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Introduction Page - First Time                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Inleiding                                            │  │
│  │                                                       │  │
│  │  Met dit formulier geeft u de getuigen voor uw       │  │
│  │  ceremonie door.                                      │  │
│  │                                                       │  │
│  │  Wat u doet in dit formulier:                        │  │
│  │  • U vult de namen van uw getuigen in (2-4)          │  │
│  │  • U stuurt een kopie van hun ID op                  │  │
│  │                                                       │  │
│  │  [Start met getuigen doorgeven →]                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Getuigen Form                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Getuige 1                                            │  │
│  │  Voornamen: [Anna Helena Elisabeth]                  │  │
│  │  Achternaam: [Janssen]                               │  │
│  │  Geboortedatum: [23-05-1990] 📅                      │  │
│  │  [📄 Paspoort_Anna_Janssen.pdf] ✓ Upload geslaagd   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Getuige 2                                            │  │
│  │  Voornamen: [Sophie]                                  │  │
│  │  Achternaam: [de Vries]                              │  │
│  │  Geboortedatum: [02-03-1990] 📅                      │  │
│  │  [📄 identiteitsbewijs-sophiedevries.pdf] ✓         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [+ Getuige toevoegen]                                     │
│                                                             │
│  [← Vorige stap]            [Opslaan en sluiten]          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Validation - Client Side                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ⚠️ Controleer uw invoer                              │  │
│  │  • De getuige moet op de datum van de ceremonie      │  │
│  │    minimaal 18 jaar oud zijn                          │  │
│  │  • Voer de voornamen van de getuige in               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [Validation runs BEFORE API call]                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 API Processing                              │
│  POST /api/dossier/[id]/getuigen                           │
│                                                             │
│  1. ✓ Authentication (Clerk)                               │
│  2. ✓ Authorization (User owns dossier)                    │
│  3. ✓ Validate count (2-4 getuigen)                        │
│  4. ✓ Delete existing witnesses                            │
│  5. ✓ Insert new witnesses                                 │
│  6. ✓ Update dossier_block status                          │
│                                                             │
│  Database: ihw.getuige                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ id | dossier_id | voornamen | achternaam | ...     │   │
│  │ uuid | uuid | Anna Helena Elisabeth | Janssen | ... │   │
│  │ uuid | uuid | Sophie | de Vries | ...               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Back to Dossier                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Openstaande acties:                                  │  │
│  │  ✓ Plan jullie ceremonie                             │  │
│  │  ✓ Geef jullie getuigen door        [Completed! ✓]  │  │
│  │  → Kies welke documenten jullie willen ontvangen     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Getuigen Section:                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Naam                    Geboortedatum                │  │
│  │  Anna Helena Elisabeth   23-05-1990                   │  │
│  │  Sophie de Vries         02-03-1990                   │  │
│  │  Miguel Vega Sánchez     26-05-1988                   │  │
│  │                                                       │  │
│  │  [✏️ Getuigen wijzigen]                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
┌──────────────┐
│   Browser    │
│  (React UI)  │
└──────┬───────┘
       │ 1. Load page
       ↓
┌──────────────────────────────────┐
│  GET /api/dossier/[id]/getuigen  │
│  • Check auth (Clerk)            │
│  • Fetch witnesses from DB       │
│  • Return formatted data         │
└──────────┬───────────────────────┘
           │ 2. Witnesses data
           ↓
┌──────────────┐
│   Browser    │
│ Fills form   │
│ with data    │
└──────┬───────┘
       │ 3. User edits
       ↓
┌──────────────┐
│  Validation  │
│   Library    │
│ (Client)     │
└──────┬───────┘
       │ 4. Validation passes
       ↓
┌───────────────────────────────────┐
│  POST /api/dossier/[id]/getuigen  │
│  • Validate auth                  │
│  • Validate data (2-4 witnesses)  │
│  • DELETE old witnesses           │
│  • INSERT new witnesses           │
│  • UPDATE dossier_block           │
└──────────┬────────────────────────┘
           │ 5. Success
           ↓
┌──────────────┐
│  PostgreSQL  │
│  (Neon)      │
│              │
│  ihw.getuige │
│  ┌─────────┐ │
│  │ Record1 │ │
│  │ Record2 │ │
│  │ Record3 │ │
│  └─────────┘ │
└──────────────┘
```

## 📊 Database Schema

```sql
-- Schema: ihw (Integrated Wedding System)
-- Table: getuige (Witness)

CREATE TABLE ihw.getuige (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    dossier_id UUID NOT NULL 
        REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    gemeente_oin TEXT NOT NULL 
        REFERENCES ihw.gemeente(oin),
    
    -- Witness Type
    is_gemeentelijke_getuige BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Personal Information
    voornamen TEXT NOT NULL,
    voorvoegsel TEXT,
    achternaam TEXT NOT NULL,
    geboortedatum DATE NOT NULL,
    geboorteplaats TEXT,
    
    -- Document Management
    document_upload_id UUID,
    document_status papier_status DEFAULT 'ontbreekt',
    
    -- Ordering
    volgorde INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_getuige_dossier_id ON ihw.getuige(dossier_id);
CREATE INDEX idx_getuige_gemeente_oin ON ihw.getuige(gemeente_oin);
CREATE INDEX idx_getuige_volgorde ON ihw.getuige(dossier_id, volgorde);
```

## ✅ Validation Rules

```
┌─────────────────────────────────────────────────────────┐
│                  Validation Rules                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  GETUIGE_VOORNAMEN_VEREIST                             │
│  → Voornamen veld mag niet leeg zijn                   │
│                                                         │
│  GETUIGE_ACHTERNAAM_VEREIST                            │
│  → Achternaam veld mag niet leeg zijn                  │
│                                                         │
│  GETUIGE_GEBOORTEDATUM_VEREIST                         │
│  → Geboortedatum veld mag niet leeg zijn               │
│                                                         │
│  GETUIGE_GEBOORTEDATUM_FORMAAT                         │
│  → Formaat: DD-MM-JJJJ (bijv. 15-03-1990)              │
│                                                         │
│  GETUIGE_MIN_LEEFTIJD                                  │
│  → Minimale leeftijd: 18 jaar (nu)                     │
│  → Priority: 1 (kritisch)                              │
│                                                         │
│  GETUIGE_MIN_LEEFTIJD_HUWELIJK                         │
│  → Minimale leeftijd: 18 jaar (op ceremonie datum)     │
│  → Priority: 1 (kritisch)                              │
│                                                         │
│  GETUIGE_MAX_LEEFTIJD                                  │
│  → Maximale leeftijd: 150 jaar                         │
│  → Priority: 1 (kritisch)                              │
│                                                         │
│  GETUIGE_HOGE_LEEFTIJD                                 │
│  → Waarschuwing: leeftijd > 100 jaar                   │
│  → Type: warning                                       │
│                                                         │
│  GETUIGEN_MIN_AANTAL                                   │
│  → Minimaal aantal getuigen: 2                         │
│  → Priority: 1 (kritisch)                              │
│                                                         │
│  GETUIGEN_MAX_AANTAL                                   │
│  → Maximaal aantal getuigen: 4                         │
│  → Priority: 1 (kritisch)                              │
│                                                         │
│  XSS & SQL Injection Prevention                        │
│  → Automatisch op alle tekstvelden                     │
│  → Priority: 1 (kritisch)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🎨 UI Components

### Error Display (Red)
```
┌────────────────────────────────────────────────────┐
│ ⚠️  Controleer uw invoer                           │
│                                                    │
│  • De getuige moet minimaal 18 jaar oud zijn      │
│  • Voer de achternaam van de getuige in           │
└────────────────────────────────────────────────────┘
```

### Warning Display (Yellow)
```
┌────────────────────────────────────────────────────┐
│ ⚠️  Let op                                          │
│                                                    │
│  • Controleer de geboortedatum - deze lijkt       │
│    onwaarschijnlijk oud                           │
└────────────────────────────────────────────────────┘
```

### Success State
```
┌────────────────────────────────────────────────────┐
│ ✓ Alle acties voltooid                            │
│                                                    │
│   U heeft alle openstaande acties voltooid.       │
│   Uw dossier is klaar voor verdere verwerking.    │
└────────────────────────────────────────────────────┘
```

## 🔐 Security Features

```
Authentication (Clerk)
├─ JWT validation
├─ Session management
└─ User identity verification

Authorization
├─ Dossier ownership check
├─ Multi-tenancy (gemeenteOin)
└─ Role-based access (future)

Input Validation
├─ XSS prevention
├─ SQL injection prevention
├─ Type checking
└─ Length limits

Data Protection
├─ HTTPS only
├─ Parameterized queries
├─ GDPR compliance
└─ Data minimization
```

## 📈 Performance Optimizations

- **Client-side validation first**: Prevents unnecessary API calls
- **Batch updates**: All witnesses updated in single transaction
- **Indexed queries**: Fast lookups by dossier_id
- **Connection pooling**: Drizzle ORM with Neon
- **Optimistic UI updates**: Immediate feedback to user
- **Error boundaries**: Graceful error handling

## 🎯 Future Enhancements

1. **Real-time validation**: As user types
2. **Auto-save drafts**: Every 30 seconds
3. **Duplicate detection**: Check if witness already exists
4. **Address lookup**: BAG API integration
5. **ID verification**: Automatic ID validation
6. **Digital signatures**: E-signature for witnesses
7. **Mobile app**: Native iOS/Android
8. **Accessibility**: Enhanced screen reader support
9. **Multi-language**: English, German, French
10. **Analytics**: Track completion rates

