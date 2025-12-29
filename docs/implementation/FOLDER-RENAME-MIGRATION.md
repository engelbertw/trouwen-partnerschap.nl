# 🔄 Folder Rename Migration Guide

## Changes Made

The folder structure has been renamed to follow a consistent numbered format:

### Old Structure ❌
```
src/app/
├── page.tsx
└── aankondiging/
    ├── start/
    │   └── page.tsx
    └── stap-1/
        └── page.tsx
```

### New Structure ✅
```
src/app/
├── page.tsx
└── 000-aankondiging/
    ├── 000-inleiding/
    │   └── page.tsx
    ├── 001-start/
    │   └── page.tsx
    └── 002-stap-1/
        └── page.tsx
```

## Route Changes

| Old Route | New Route | Purpose |
|-----------|-----------|---------|
| `/` | `/` | Landing page (unchanged) |
| `/aankondiging/start` | `/000-aankondiging/001-start` | Auth checkpoint |
| `/aankondiging/stap-1` | `/000-aankondiging/002-stap-1` | Form step 1 |
| N/A | `/000-aankondiging/000-inleiding` | Redirect to landing page |

## Files Updated

### 1. `src/app/page.tsx`
**Changed**: Link href from `/aankondiging/start` → `/000-aankondiging/001-start`

### 2. `src/components/Header.tsx`
**Changed**: Route check from `/aankondiging` → `/000-aankondiging`

### 3. New Files Created
- `src/app/000-aankondiging/000-inleiding/page.tsx` (copy of landing page logic)
- `src/app/000-aankondiging/001-start/page.tsx` (auth checkpoint)
- `src/app/000-aankondiging/002-stap-1/page.tsx` (form step 1)

## Manual Cleanup Required

⚠️ **Please manually delete the old folder**:
```bash
# Delete old aankondiging folder
rm -rf src/app/aankondiging
```

Or on Windows PowerShell:
```powershell
# Delete old aankondiging folder
Remove-Item -Recurse -Force src\app\aankondiging
```

## Naming Convention

Going forward, use this format for all pages:

```
XXX-category/
├── YYY-page-name/
│   └── page.tsx
```

Where:
- `XXX` = Category number (000, 100, 200, etc.)
- `YYY` = Page number within category (000, 001, 002, etc.)
- Use kebab-case for descriptive names

### Examples:
- `000-aankondiging/` - Wedding announcement flow
- `000-aankondiging/000-inleiding/` - Introduction page
- `000-aankondiging/001-start/` - Start/auth page
- `000-aankondiging/002-stap-1/` - Form step 1
- `000-aankondiging/003-stap-2/` - Form step 2 (future)
- `100-beheer/` - Admin/management (future)
- `200-rapportage/` - Reporting (future)

## Testing Checklist

After cleanup, verify:

- [ ] Landing page loads at `/`
- [ ] "Start aankondiging" button links to `/000-aankondiging/001-start`
- [ ] Auth checkpoint works correctly
- [ ] Redirect to `/000-aankondiging/002-stap-1` after login
- [ ] Close button (X) appears on all `/000-aankondiging/*` routes
- [ ] No 404 errors in browser console
- [ ] All links work correctly

## Benefits of New Structure

### 1. **Better Organization**
- Clear numbering shows page order and hierarchy
- Easy to see which pages belong to which flow

### 2. **Scalability**
- Can easily add more categories (100-xxx, 200-xxx)
- Can insert pages between existing ones (001a, 001b if needed)

### 3. **Self-Documenting**
- File structure matches logical flow
- New developers can understand structure at a glance

### 4. **Alphabetical Sorting**
- Folders sort naturally in file explorers
- Related pages stay grouped together

## URL Structure

The numbered folders are reflected in URLs:
- `/000-aankondiging/001-start` - Clean, semantic URL
- Numbers provide logical ordering
- Descriptive names maintain readability

## Next Steps

1. **Delete old folder** manually (see command above)
2. **Test all routes** to ensure everything works
3. **Update bookmarks** if any exist
4. **Update any external documentation** that references old URLs
5. **Apply naming convention** to all future pages

---

**Status**: ✅ Migration complete (pending manual cleanup)  
**Breaking Changes**: URLs have changed (but old URLs can be redirected if needed)  
**Backward Compatibility**: Not maintained (fresh implementation)

