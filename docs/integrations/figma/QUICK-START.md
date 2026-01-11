# Figma Integratie - Quick Start

**Snelle setup in 5 minuten**

## Stap 1: Figma Token

1. Ga naar https://www.figma.com/settings
2. Scroll naar "Personal access tokens"
3. Klik "Create new token"
4. Kopieer het token

## Stap 2: Environment Variabele

Voeg toe aan `.env.local`:

```bash
FIGMA_ACCESS_TOKEN=je_token_hier
```

## Stap 3: MCP Server (Cursor AI)

**Via Cursor Settings:**
1. `Cmd/Ctrl + Shift + P` → "Preferences: Open Settings (JSON)"
2. Voeg toe:
```json
{
  "mcpServers": {
    "figma-remote": {
      "url": "https://mcp.figma.com/mcp",
      "transport": "http"
    }
  }
}
```

**In Figma:**
1. Open design in browser
2. Klik "Dev Mode"
3. Klik "Set up an MCP client"
4. Kies "Cursor"

## Stap 4: Test

```typescript
// In een Server Component
import { getFigmaFile, parseFigmaUrl } from '@/lib/figma';

const url = 'https://www.figma.com/file/abc123/Design';
const parsed = parseFigmaUrl(url);
const file = await getFigmaFile(parsed!.fileKey, process.env.FIGMA_ACCESS_TOKEN!);
```

Of via API:

```bash
curl "http://localhost:3000/api/figma?url=https://www.figma.com/file/abc123/Design"
```

## Klaar! 🎉

Zie [README.md](./README.md) voor volledige documentatie.

