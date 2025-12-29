# Getuigen (Witnesses) Implementation Complete

## ✅ Completed Features

### 1. Introduction Page
- Clean introduction explaining the witness requirements
- Clear instructions about requirements (2-4 witnesses, 18+ years old)
- Information about ID document uploads
- Smooth transition to the main form

### 2. Main Getuigen Form (`/dossier/[id]/getuigen`)
- **Database Integration**: Fully connected to PostgreSQL via Drizzle ORM
- **Dynamic Witness Management**: 
  - Start with 2 witnesses (minimum required)
  - Add up to 4 witnesses total
  - Remove witnesses (minimum 2 must remain)
- **Form Fields**:
  - Voornamen (required)
  - Voorvoegsel (optional)
  - Achternaam (required)
  - Geboortedatum (required, date picker)
  - Geboorteplaats (optional)
  - ID document upload placeholder

### 3. API Routes (`/api/dossier/[id]/getuigen`)
- **GET**: Fetch all witnesses for a dossier
- **POST**: Create/update witnesses (replaces all)
- **DELETE**: Remove all witnesses
- Full authentication and authorization checks
- Date formatting (DD-MM-YYYY ↔ database format)
- Multi-tenancy support (gemeenteOin)

### 4. Validation System
- **Client-side validation** using centralized validation library
- **Validation rules**:
  - `GETUIGE_VOORNAMEN_VEREIST`: First names required
  - `GETUIGE_ACHTERNAAM_VEREIST`: Last name required
  - `GETUIGE_GEBOORTEDATUM_VEREIST`: Birth date required
  - `GETUIGE_GEBOORTEDATUM_FORMAAT`: Date format (DD-MM-YYYY)
  - `GETUIGE_MIN_LEEFTIJD`: Minimum age 18 years
  - `GETUIGE_MIN_LEEFTIJD_HUWELIJK`: Must be 18 on ceremony date
  - `GETUIGE_MAX_LEEFTIJD`: Maximum age check (150 years)
  - `GETUIGE_HOGE_LEEFTIJD`: Warning for age > 100 years
  - `GETUIGEN_MIN_AANTAL`: Minimum 2 witnesses required
  - `GETUIGEN_MAX_AANTAL`: Maximum 4 witnesses allowed
- Visual feedback: Red boxes for errors, yellow boxes for warnings
- Auto-scroll to validation messages on submit

### 5. Database Schema
Using existing `getuige` table in `ihw` schema:
```sql
CREATE TABLE ihw.getuige (
  id UUID PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
  gemeente_oin TEXT NOT NULL REFERENCES ihw.gemeente(oin),
  is_gemeentelijke_getuige BOOLEAN DEFAULT FALSE,
  voornamen TEXT NOT NULL,
  voorvoegsel TEXT,
  achternaam TEXT NOT NULL,
  geboortedatum DATE NOT NULL,
  geboorteplaats TEXT,
  document_upload_id UUID,
  document_status papier_status DEFAULT 'ontbreekt',
  volgorde INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Integration with Dossier Flow
- Witnesses are tracked in dossier status API
- `acties.getuigen` flag shows if witnesses need to be added/completed
- Count check: 2-4 witnesses required
- Shown as "openstaande actie" in main dossier view

## 📝 Data Flow

1. **User navigates** to `/dossier/[id]/getuigen`
2. **Introduction shown** (first time only)
3. **Form loads** existing witnesses from database (if any)
4. **User fills in** witness information
5. **Client-side validation** runs on submit
6. **API validates** and stores in database
7. **User returns** to dossier overview

## 🎨 UI/UX Features

- **NL Design System compliance**: Follows Dutch government design standards
- **Responsive design**: Works on mobile and desktop
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Visual feedback**: 
  - Loading states
  - Success indicators
  - Clear error messages in Dutch
  - File upload status indicators
- **Progress indication**: Shows completion in dossier overview

## 🔐 Security Features

- **Authentication**: Clerk auth required
- **Authorization**: Users can only access their own dossiers
- **Data validation**: Both client and server-side
- **XSS prevention**: Input sanitization
- **SQL injection prevention**: Parameterized queries via Drizzle
- **GDPR compliance**: Personal data properly secured

## 📋 File Upload Note

**Status**: Placeholder implementation included

The current implementation includes:
- UI for file selection
- File type validation (PDF, JPG, PNG)
- File size validation (max 10MB)
- Visual feedback for uploaded files

**For production**, a full file upload system would require:
1. **Storage service** (AWS S3, Azure Blob Storage, or similar)
2. **Upload API endpoint** (`POST /api/upload/document`)
3. **File processing** (virus scanning, format conversion)
4. **Secure URLs** (signed URLs with expiration)
5. **Database tracking** (`document_upload_id` field)

Example implementation would add:
```typescript
// src/app/api/upload/document/route.ts
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Upload to storage service
  const uploadId = await uploadToStorage(file);
  
  return NextResponse.json({ 
    success: true, 
    documentUploadId: uploadId 
  });
}
```

## 🔄 Related Files

### Created/Modified:
- ✅ `src/app/dossier/[id]/getuigen/page.tsx` - Main witnesses form
- ✅ `src/app/api/dossier/[id]/getuigen/route.ts` - API endpoints
- ✅ `src/lib/validation.ts` - Added `validateGetuige()` and `validateGetuigen()`

### Existing (used):
- `src/db/schema.ts` - Database schema (getuige table)
- `src/app/api/dossier/[id]/route.ts` - Dossier overview API (checks witnesses)
- `src/components/GemeenteLogo.tsx` - Header component

## 📊 Testing Checklist

- [x] Page loads without errors
- [x] Introduction shows on first visit
- [x] Can add witnesses (up to 4)
- [x] Can remove witnesses (minimum 2)
- [x] Validation works (required fields, age checks)
- [x] Date format validation (DD-MM-YYYY)
- [x] Age validation (18+)
- [x] API creates witnesses in database
- [x] API fetches witnesses from database
- [x] Navigation back to dossier works
- [x] Error messages display properly
- [x] Warning messages display properly
- [x] Dossier overview shows correct status

## 🎯 Next Steps (Future Enhancements)

1. **File Upload Service**: Implement actual file storage
2. **Document Verification**: Admin view to verify uploaded IDs
3. **Email Notifications**: Notify witnesses about the ceremony
4. **Digital Signatures**: Allow witnesses to digitally confirm attendance
5. **Municipal Witnesses**: Option to use gemeente-provided witnesses
6. **Photo Upload**: Add witness photos for ceremony booklet

## 📚 Documentation References

- [Validation System](./docs/VALIDATION-SYSTEM.md)
- [Database Schema](./sql/070_validation_rules.sql)
- [NL Design System](https://nldesignsystem.nl/)
- [Burgerlijk Wetboek - Getuigen](https://wetten.overheid.nl/)

