# Figma MCP Server Setup voor Cursor

**Status**: ✅ Configuratie instructies  
**Laatst bijgewerkt**: 2025-12-29

## Overzicht

De Figma MCP (Model Context Protocol) server maakt het mogelijk voor Cursor AI om direct toegang te krijgen tot Figma designs. Dit stelt de AI in staat om:

- Design context te begrijpen
- Code te genereren op basis van designs
- Componenten te koppelen tussen Figma en code
- Design-specificaties op te halen

---

## Stap 1: MCP Server Configuratie in Cursor

### Optie A: Via Cursor Settings UI

1. **Open Cursor Settings**
   - Druk op `Cmd/Ctrl + ,` (of `Cmd/Ctrl + Shift + P` → "Preferences: Open Settings")
   - Ga naar **Extensions** → **MCP**

2. **Voeg MCP Server toe**
   - Klik op **"Add Server"** of **"+"**
   - Kies **"HTTP"** als transport type

3. **Configureer Remote MCP Server** (aanbevolen voor browser-based Figma)
   ```
   Server Name: figma-remote
   URL: https://mcp.figma.com/mcp
   Transport: HTTP
   Description: Figma Remote MCP Server - voor browser-based Figma
   ```

4. **Configureer Desktop MCP Server** (optioneel, voor lokale Figma app)
   ```
   Server Name: figma-desktop
   URL: http://127.0.0.1:3845/mcp
   Transport: HTTP
   Description: Figma Desktop MCP Server - voor lokale Figma app
   ```

### Optie B: Via Settings JSON

1. **Open Settings JSON**
   - Druk op `Cmd/Ctrl + Shift + P`
   - Type "Preferences: Open Settings (JSON)"
   - Of ga naar Settings → zoek "settings.json"

2. **Voeg MCP configuratie toe**

   Voeg de volgende configuratie toe aan je `settings.json`:

   ```json
   {
     "mcpServers": {
       "figma-remote": {
         "url": "https://mcp.figma.com/mcp",
         "transport": "http",
         "description": "Figma Remote MCP Server - voor browser-based Figma designs",
         "enabled": true
       },
       "figma-desktop": {
         "url": "http://127.0.0.1:3845/mcp",
         "transport": "http",
         "description": "Figma Desktop MCP Server - voor lokale Figma desktop app",
         "enabled": false
       }
     }
   }
   ```

3. **Herstart Cursor** na het toevoegen van de configuratie

---

## Stap 2: Activeer MCP in Figma

### Voor Remote MCP Server (Browser)

1. **Open Figma in browser**
   - Ga naar [figma.com](https://www.figma.com)
   - Open een Design-bestand

2. **Schakel Dev Mode in**
   - Klik op **"Dev Mode"** in de rechterbovenhoek
   - Of druk op `Shift + D`

3. **Setup MCP Client**
   - Klik op **"Set up an MCP client"** in Dev Mode panel
   - Kies **"Cursor"** als ontwikkeltool
   - Volg de instructies om toegang te verlenen

4. **Verifieer verbinding**
   - Je zou een bevestiging moeten zien in Cursor
   - Test door een Figma URL te plakken in Cursor chat

### Voor Desktop MCP Server (Lokale App)

1. **Open Figma Desktop App**
   - Zorg dat je de nieuwste versie hebt
   - Open een Design-bestand

2. **Schakel Dev Mode in**
   - Klik op **"Dev Mode"** in de rechterbovenhoek
   - Of druk op `Shift + D`

3. **Enable Desktop MCP Server**
   - Klik op **"Enable desktop MCP server"** in Dev Mode panel
   - De server start op `http://127.0.0.1:3845/mcp`

4. **Verifieer verbinding**
   - Check of de server draait door `http://127.0.0.1:3845/mcp` te bezoeken
   - Test door een Figma URL te plakken in Cursor chat

---

## Stap 3: Test de Integratie

### Test 1: Basis Connectiviteit

1. **Open een Figma design** in browser of desktop app
2. **Kopieer de link** naar een frame of component:
   - Rechtsklik op een laag
   - Kies **"Copy link to selection"**
3. **Plak de link in Cursor chat**
4. **Vraag om code generatie**:
   ```
   Generate a React component based on this Figma design
   ```

### Test 2: Code Connect

1. **Open een Figma library bestand** met componenten
2. **Schakel Dev Mode in**
3. **Kies "Library → Connect components to code"**
4. **Volg instructies** om componenten te koppelen
5. **Test in Cursor** door te vragen:
   ```
   Show me the code for this Figma component
   ```

---

## Troubleshooting

### MCP Server niet gevonden

**Probleem**: Cursor kan de MCP server niet vinden

**Oplossingen**:
- Check of de URL correct is (geen trailing slash)
- Check of `transport: "http"` is ingesteld
- Herstart Cursor na configuratie wijzigingen
- Check Cursor logs voor error messages

### Authenticatie gefaald

**Probleem**: "Unauthorized" of "Access denied" error

**Oplossingen**:
- Check of je ingelogd bent in Figma
- Check of je toegang hebt tot het design bestand
- Probeer opnieuw te authenticeren via Figma Dev Mode
- Check of de MCP client correct is geconfigureerd

### Desktop server start niet

**Probleem**: Desktop MCP server op `127.0.0.1:3845` is niet bereikbaar

**Oplossingen**:
- Check of Figma desktop app draait
- Check of Dev Mode is ingeschakeld
- Check of "Enable desktop MCP server" is aangevinkt
- Check firewall instellingen (poort 3845 moet open zijn)
- Probeer remote MCP server als alternatief

### Design context niet beschikbaar

**Probleem**: Cursor kan design data niet ophalen

**Oplossingen**:
- Check of de Figma URL correct is geformatteerd
- Check of je toegang hebt tot het bestand
- Check of de node ID correct is (kan encoded zijn)
- Probeer een andere node of frame

---

## Best Practices

### Remote vs Desktop Server

- **Remote Server** (aanbevolen):
  - Werkt met browser-based Figma
  - Geen lokale app nodig
  - Altijd beschikbaar zolang je ingelogd bent
  - Minder lokaal resources

- **Desktop Server**:
  - Werkt alleen met Figma desktop app
  - Sneller voor lokale bestanden
  - Vereist dat app draait
  - Kan offline werken (voor lokale bestanden)

### Code Connect Setup

1. **Organiseer componenten** in Figma libraries
2. **Gebruik consistente naming** tussen Figma en code
3. **Documenteer componenten** in Figma
4. **Koppel componenten** systematisch
5. **Update koppelingen** wanneer designs veranderen

### Security

- **Geen gevoelige data** in Figma designs die je deelt
- **Beperk toegang** tot design bestanden
- **Gebruik private links** voor gevoelige designs
- **Review AI gegenereerde code** voordat je het commit

---

## Referenties

- [Figma MCP Server Documentation](https://developers.figma.com/docs/figma-mcp-server/)
- [Code Connect Guide](https://www.figma.com/developers/code-connect)
- [Cursor MCP Documentation](https://cursor.sh/docs/mcp)

---

## Volgende Stappen

Na het configureren van MCP:

1. ✅ Test de basis connectiviteit
2. ✅ Setup Code Connect voor je componenten
3. ✅ Gebruik Figma API integratie voor runtime design data
4. ✅ Documenteer je design system componenten

Zie [Figma API Integration](./README.md) voor het gebruik van designs in de applicatie.

