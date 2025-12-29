# Next.js 15 Dynamic Route Parameters Fix

## 🐛 Probleem

In Next.js 15 zijn `params` in API routes **async** geworden. Dit was een breaking change:

```typescript
// ❌ FOUT (Next.js 14 stijl)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }  // Sync
) {
  const { id } = params;  // ❌ Error!
}
```

**Error:**
```
Error: Route "/api/dossier/[id]" used `params.id`. 
`params` should be awaited before using its properties.
```

## ✅ Oplossing

`params` moet nu getypeerd worden als `Promise` en ge-await worden:

```typescript
// ✅ CORRECT (Next.js 15 stijl)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // Promise!
) {
  const { id } = await params;  // ✅ Await!
  // Nu kun je id gebruiken
}
```

## 📝 Aangepaste Bestanden

### ✅ API Routes Gefixed

1. **`src/app/api/dossier/[id]/route.ts`**
   ```typescript
   // Regel 9: Promise type
   { params }: { params: Promise<{ id: string }> }
   
   // Regel 13: Await params
   const { id } = await params;
   ```

2. **`src/app/api/dossier/[id]/samenvatting/route.ts`**
   ```typescript
   // Regel 9: Promise type
   { params }: { params: Promise<{ id: string }> }
   
   // Regel 13: Await params
   const { id } = await params;
   ```

## 🧹 Cache Cleanup

Als je de error nog steeds ziet na de fix, clean de build cache:

### Windows (PowerShell/CMD)
```bash
.\clean-cache.bat
npm run dev
```

### macOS/Linux
```bash
rm -rf .next
rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo
npm run dev
```

## 📚 Next.js 15 Breaking Changes

Deze change is onderdeel van Next.js 15's async request APIs:

- ✅ `params` is nu async
- ✅ `searchParams` is nu async
- ✅ `cookies()` was al async
- ✅ `headers()` was al async

**Documentatie:** https://nextjs.org/docs/messages/sync-dynamic-apis

## 🔍 Verificatie

Check of alle routes correct zijn:

```bash
# Zoek naar oude sync params patterns
grep -r "params: { " src/app/api/

# Zoek naar correcte Promise patterns
grep -r "params: Promise<{" src/app/api/
```

Moet vinden:
```
src/app/api/dossier/[id]/route.ts: { params }: { params: Promise<{ id: string }> }
src/app/api/dossier/[id]/samenvatting/route.ts: { params }: { params: Promise<{ id: string }> }
```

## ✅ Status

- [x] API routes aangepast naar async params
- [x] Type definitions gecorrigeerd
- [x] Await statements toegevoegd
- [x] Build cache gecleaned
- [x] Cleanup script gemaakt (`clean-cache.bat`)

**Alles werkt nu correct met Next.js 15!** 🎉

## 🚨 Voor Toekomstige Routes

Bij het maken van nieuwe dynamic routes, **altijd** deze pattern gebruiken:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ALTIJD eerst params awaiten!
  const { id } = await params;
  
  // Rest van je code...
}
```

## 📖 Referenties

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Async Request APIs](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

