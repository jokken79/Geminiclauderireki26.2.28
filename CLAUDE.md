# CLAUDE.md — Repository Root

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo-style project. The main application lives in `staffing-os/`.

```
/
├── staffing-os/          — Main application (Next.js)
├── PromptCompleta        — Original project specification (Spanish)
├── PromtCompleto         — Additional project specification
├── gemini26.2.28         — Gemini prompt/context file
└── README.md
```

**All development commands must be run from the `staffing-os/` directory.**

See `staffing-os/CLAUDE.md` for detailed application guidance.

## Quick Reference

```bash
cd staffing-os
npm run dev              # Start dev server on port 3433
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest
npm run db:migrate       # Prisma migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

## Key Conventions

- The application is a **Japanese staffing agency management system** (人材派遣管理システム)
- UI labels, error messages in Server Actions, and most user-facing text are in **Japanese**
- Code (variable names, comments in code) is in **English**, except for domain-specific constants
- The dev server runs on **port 3433** (not the default 3000)

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
