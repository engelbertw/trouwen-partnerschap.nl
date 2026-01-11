# Figma Integratie

**Status**: ✅ Geïmplementeerd  
**Laatst bijgewerkt**: 2025-12-29

## Overzicht

Deze integratie maakt het mogelijk om Figma designs op te halen en te gebruiken in de applicatie via de Figma REST API. Er zijn twee manieren om Figma te gebruiken:

1. **MCP Server (Cursor AI)**: Voor AI-assistentie tijdens development
2. **Figma API (Next.js)**: Voor het ophalen en gebruiken van designs in de applicatie

---

## Setup

### Stap 1: Figma Access Token genereren

1. Ga naar [Figma Account Settings](https://www.figma.com/settings)
2. Scroll naar "Personal access tokens"
3. Klik op "Create new token"
4. Geef een naam op (bijv. "Huwelijk App Development")
5. Kopieer het gegenereerde token

### Stap 2: Environment variabelen configureren

Voeg het token toe aan je `.env.local` bestand:

```bash
# Figma API Access Token
FIGMA_ACCESS_TOKEN=your_figma_access_token_here
```

**⚠️ Belangrijk**: Zorg dat `.env.local` in `.gitignore` staat (dit is al het geval).

### Stap 3: MCP Server configureren (Cursor AI)

De MCP configuratie moet handmatig worden toegevoegd aan Cursor:

1. **Open Cursor Settings**
   - Druk op `Cmd/Ctrl + Shift + P`
   - Type "Preferences: Open Settings (JSON)"
   - Of ga naar Settings → Extensions → MCP

2. **Voeg MCP server configuratie toe**

   Voor **Remote MCP Server** (browser-based Figma):
   ```json
   {
     "mcpServers": {
       "figma-remote": {
         "url": "https://mcp.figma.com/mcp",
         "transport": "http",
         "description": "Figma Remote MCP Server"
       }
     }
   }
   ```

   Voor **Desktop MCP Server** (lokale Figma app):
   ```json
   {
     "mcpServers": {
       "figma-desktop": {
         "url": "http://127.0.0.1:3845/mcp",
         "transport": "http",
         "description": "Figma Desktop MCP Server"
       }
     }
   }
   ```

3. **Activeer MCP in Figma**
   - Open een Figma Design-bestand in de browser
   - Schakel over naar **Dev Mode**
   - Klik op **"Set up an MCP client"**
   - Volg de instructies voor Cursor
   - Geef toegang wanneer gevraagd

---

## Gebruik

### In Server Components

```typescript
import { getFigmaFile, getFigmaNode, parseFigmaUrl } from '@/lib/figma';

export default async function DesignPage() {
  const figmaUrl = 'https://www.figma.com/file/abc123/Design?node-id=1%3A2';
  const parsed = parseFigmaUrl(figmaUrl);
  
  if (!parsed) {
    return <div>Invalid Figma URL</div>;
  }

  const { fileKey, nodeId } = parsed;
  const accessToken = process.env.FIGMA_ACCESS_TOKEN!;

  // Haal volledige file op
  const file = await getFigmaFile(fileKey, accessToken);

  // Of haal specifieke node op
  if (nodeId) {
    const node = await getFigmaNode(fileKey, nodeId, accessToken);
    // Gebruik node data...
  }

  return <div>Design loaded</div>;
}
```

### In Client Components

```typescript
'use client';

import { useState, useEffect } from 'react';

export function FigmaImage({ figmaUrl }: { figmaUrl: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      try {
        const response = await fetch(
          `/api/figma?url=${encodeURIComponent(figmaUrl)}&action=image&format=png&scale=2`
        );
        const data = await response.json();
        
        if (data.success) {
          setImageUrl(data.imageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch Figma image:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [figmaUrl]);

  if (loading) return <div>Loading...</div>;
  if (!imageUrl) return <div>Failed to load image</div>;

  return <img src={imageUrl} alt="Figma design" />;
}
```

### Via API Routes

```typescript
// GET /api/figma?url={figmaUrl}&action={action}

// Voorbeelden:
// - Haal volledige file op
fetch('/api/figma?url=https://www.figma.com/file/abc123/Design')

// - Haal specifieke node op
fetch('/api/figma?url=https://www.figma.com/file/abc123/Design?node-id=1%3A2&action=node')

// - Haal gerenderde image op
fetch('/api/figma?url=https://www.figma.com/file/abc123/Design?node-id=1%3A2&action=image&format=png&scale=2')

// - Haal alle componenten op
fetch('/api/figma?url=https://www.figma.com/file/abc123/Design&action=components')
```

---

## API Endpoints

### `GET /api/figma`

Haal Figma design data op.

**Query Parameters:**
- `url` (required): Figma URL - Format: `https://www.figma.com/file/{fileKey}/{name}?node-id={nodeId}`
- `action` (optional): Type van data
  - `file` (default): Volledige file
  - `node`: Specifieke node
  - `image`: Gerenderde image van node
  - `components`: Alle componenten in file
- `format` (optional, alleen voor `action=image`): `png` | `svg` | `pdf` | `jpg` (default: `png`)
- `scale` (optional, alleen voor `action=image`): Number (default: `2`)

**Response:**
```json
{
  "success": true,
  "data": { /* Figma file/node data */ },
  "fileKey": "abc123",
  "nodeId": "1:2",
  "action": "file"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

---

## Utility Functions

### `parseFigmaUrl(url: string)`

Parse een Figma URL naar fileKey en nodeId.

```typescript
import { parseFigmaUrl } from '@/lib/figma';

const result = parseFigmaUrl('https://www.figma.com/file/abc123/Design?node-id=1%3A2');
// Returns: { fileKey: 'abc123', nodeId: '1:2' }
```

### `getFigmaFile(fileKey: string, accessToken: string)`

Haal volledige Figma file op.

### `getFigmaNode(fileKey: string, nodeId: string, accessToken: string)`

Haal specifieke node op.

### `getFigmaImage(fileKey: string, nodeId: string, accessToken: string, options?)`

Haal gerenderde image op van een node.

### `findNodesByName(node: FigmaNode, name: string, exact?: boolean)`

Zoek nodes in een Figma file op naam.

### `figmaColorToHex(color: { r, g, b, a? })`

Converteer Figma RGB color naar CSS hex.

---

## MCP Server Gebruik (Cursor AI)

Nadat je de MCP server hebt geconfigureerd, kun je in Cursor:

1. **Figma designs bekijken**
   - Kopieer een Figma URL
   - Plak in Cursor chat
   - Vraag om code te genereren op basis van het design

2. **Code Connect gebruiken**
   - Verbind Figma componenten met code componenten
   - Open Figma in Dev Mode
   - Kies "Library → Connect components to code"
   - Volg instructies om componenten te koppelen

3. **Design context ophalen**
   - Gebruik prompts zoals: "Generate a React component based on this Figma design"
   - Cursor gebruikt automatisch de MCP server om design data op te halen

---

## Best Practices

### Caching
- Figma API responses worden gecached (1 uur voor files/nodes, 30 minuten voor images)
- Gebruik `revalidate` optie in Next.js voor custom cache strategie

### Error Handling
- Check altijd of `FIGMA_ACCESS_TOKEN` is geconfigureerd
- Valideer Figma URLs voordat je ze gebruikt
- Handle 401 (unauthorized) en 404 (not found) errors gracefully

### Performance
- Gebruik `action=image` alleen wanneer nodig (images zijn zwaarder)
- Gebruik `scale=1` voor thumbnails, `scale=2` voor normale weergave
- Overweeg image optimization met Next.js Image component

### Security
- **Nooit** commit Figma access tokens naar git
- Gebruik environment variabelen voor alle tokens
- Rotate tokens regelmatig
- Beperk token permissions in Figma settings

---

## Troubleshooting

### "Figma access token not configured"
- Check of `FIGMA_ACCESS_TOKEN` in `.env.local` staat
- Herstart de development server na het toevoegen van de variabele
- Check of `.env.local` niet in git is gecommit

### "Invalid Figma URL format"
- Zorg dat de URL begint met `https://www.figma.com/file/`
- Check of `node-id` parameter correct is (kan encoded zijn als `1%3A2`)

### "Node not found"
- Check of de node ID correct is
- Zorg dat je toegang hebt tot het Figma bestand
- Check of de node bestaat in het bestand

### "401 Unauthorized"
- Check of het access token geldig is
- Genereer een nieuw token in Figma settings
- Check of het token niet is ingetrokken

### MCP Server werkt niet
- Check of Figma Dev Mode is ingeschakeld
- Check of MCP server is geconfigureerd in Cursor settings
- Herstart Cursor na configuratie wijzigingen
- Check of de juiste URL wordt gebruikt (remote vs desktop)

---

## Referenties

- [Figma REST API Documentation](https://www.figma.com/developers/api)
- [Figma MCP Server Setup](https://developers.figma.com/docs/figma-mcp-server/)
- [Code Connect Documentation](https://www.figma.com/developers/code-connect)
- [Figma Personal Access Tokens](https://www.figma.com/settings)

---

## Gerelateerde Documentatie

- [Project Structure](../../../.cursor/rules/project-structure.mdc)
- [API Architecture](../architecture/api/README.md)
- [NL Design System](../../../.cursor/rules/nl-design-system.mdc)

