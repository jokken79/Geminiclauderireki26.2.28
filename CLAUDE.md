<!-- ANTIGRAVITY-START -->

## Ecosistema Antigravity

Proyecto integrado con el ecosistema **Antigravity v2.1.0** — 40+ agentes, 732 skills.
Instalado por Nexus el 2026-03-01.

### Archivos instalados

```
.antigravity/
├── config.json          — gateway URL y configuracion del ecosistema
├── sdk/
│   ├── client.py        — SDK Python (stdlib, sin dependencias)
│   └── antigravity.js   — helper REST para JS/TS
└── example.py / .js     — ejemplo de uso listo para ejecutar
```

### Conexion al ecosistema

### API REST (cualquier lenguaje)

```
GET  http://localhost:4747/health          — estado del ecosistema
GET  http://localhost:4747/agents          — listar agentes
POST http://localhost:4747/agents/{name}   — ejecutar agente  { "task": "..." }
GET  http://localhost:4747/memory          — memoria compartida
```

### IDEs configurados

Los siguientes archivos MCP fueron creados/actualizados con smart-merge:

| IDE | Archivo |
|-----|---------|
| Claude Code | `.mcp.json` |
| Cursor | `.cursor/mcp.json` |
| Windsurf | `.windsurf/mcp.json` |
| Roo Code / Cline | `.vscode/cline_mcp_settings.json` |

### Requisito

El Nexus debe estar corriendo para que el gateway REST y los servidores MCP funcionen.
Abre `nexus.exe` y presiona **START** en los servidores antes de usar el SDK.

<!-- ANTIGRAVITY-END -->
