# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Staffing OS** is a Japanese staffing agency management system (人材派遣管理システム) for managing candidates, dispatch workers (派遣社員), contract workers (請負), client companies, documents, and compliance workflows.

## Commands

```bash
npm run dev          # Start dev server on port 3333 (not 3000)
npm run build        # Production build
npm run lint         # ESLint

npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (destructive)
```

No tests exist yet. Vitest is installed as a dev dependency but unconfigured.

Environment requires PostgreSQL. Copy `.env.example` to `.env` and configure `DATABASE_URL`, `AUTH_SECRET`, and optional OCR provider keys. Note: `.env.example` shows `AUTH_URL` on port 3000 but dev server runs on **3333**.

### Seed Credentials

After `npm run db:seed`, two users are available:

| Email | Password | Role |
|-------|----------|------|
| `admin@staffing-os.jp` | `admin123` | SUPER_ADMIN |
| `tantosha@staffing-os.jp` | `tantosha123` | TANTOSHA |

## Architecture

**Stack:** Next.js 16 (App Router) + Prisma 6 + PostgreSQL + NextAuth 5 + TailwindCSS 4 + shadcn/ui + Zustand + react-hook-form + Zod

**Path alias:** `@/*` maps to `./src/*`

### Key Directories

- `src/app/(dashboard)/` — Route groups for each domain (candidates, companies, hakenshain, ukeoi, documents, ocr, import-export, settings)
- `src/app/(auth)/` — Login page
- `src/actions/` — Server Actions (`"use server"`) for all data mutations; each domain has its own file
- `src/components/` — React components organized by domain; `ui/` contains shadcn/ui primitives
- `src/lib/` — Auth config (`auth.ts`), Prisma singleton (`prisma.ts`), RBAC helpers (`rbac.ts`), constants, and Japanese-specific utilities
- `src/lib/validators/` — Zod schemas organized by domain: `candidate.ts` (8-step form), `company.ts`, `hakenshain.ts`, `ukeoi.ts`, `shared.ts` (postal code, phone, email patterns)
- `src/services/` — Business logic: `ocr-service.ts` (multi-provider OCR), `skill-sheet-service.ts` (anonymization)
- `prisma/schema.prisma` — Database schema

### Data Flow & Conventions

All mutations go through **Server Actions** in `src/actions/`. Each action follows a consistent pattern:
1. `requireRole()` — check RBAC permissions
2. Zod schema validation
3. Prisma query (often in a `$transaction`)
4. Write to `AuditLog` or `AdminAuditLog`
5. `revalidatePath()` for cache invalidation

Error messages in Server Actions are in **Japanese** (e.g., `"認証が必要です"`, `"権限がありません"`). Maintain this convention when adding new actions.

Action files: `candidates.ts`, `companies.ts`, `hakenshain.ts`, `ukeoi.ts`, `documents.ts`, `users.ts`, `dashboard.ts`, `import-export.ts`, `ocr.ts`

### Authentication & RBAC

- NextAuth with Credentials provider (bcrypt passwords), JWT sessions (24h), middleware redirect at `src/middleware.ts`
- 8 roles in hierarchy: `SUPER_ADMIN > ADMIN > KEITOSAN > TANTOSHA > COORDINATOR > KANRININSHA > EMPLOYEE > CONTRACT_WORKER`
- Role labels and navigation permissions defined in `src/lib/constants.ts`
- `requireRole()` in `src/lib/rbac.ts` enforces role checks inside Server Actions — throws if unauthenticated or insufficient role
- Key permission thresholds: `candidates:read` → COORDINATOR, `candidates:write` → TANTOSHA, `candidates:delete` → ADMIN, `users:manage` → ADMIN

### Database Models

Core: `User`, `Candidate`, `ClientCompany`, `HakenshainAssignment`, `UkeoiAssignment`, `Document`, `SkillSheet`, `Alert`, `AuditLog`, `AdminAuditLog`

Supporting: `EducationHistory`, `WorkHistory`, `Qualification`, `FamilyMember`

Key enums: `CandidateStatus`, `VisaStatus` (12 Japanese immigration statuses), `DocumentType`, `AssignmentStatus`, `AlertType`, `JlptLevel`

### Japanese-Specific Features

- Three name systems on candidates: Kanji, Furigana (ruby), Romaji
- `src/lib/wareki.ts` — Japanese calendar (Heisei/Reiwa) conversion
- `src/lib/teishokubi.ts` — 3-year dispatch limit (抵触日) calculation
- 47 Japanese prefectures in constants
- JLPT levels N1–N5

### OCR Integration

`src/services/ocr-service.ts` implements a multi-provider circuit breaker:
1. Azure Computer Vision (primary)
2. Google Gemini Vision (backup)
3. OpenAI Vision (secondary)
4. Demo mode (no API keys required)

Extracts Japanese names, birth dates, visa info from document images.

### Multi-Step Forms

Candidate creation uses an 8-step form pattern with components under `src/components/candidates/steps/`. Each step has a matching Zod schema in `src/lib/validators/candidate.ts` (steps: basic info → contact → visa → photo → work history → skills → family → other).

### Docker / Production

- `next.config.ts` uses `output: "standalone"` for Docker
- `docker-compose.yml` for development, `docker-compose.prod.yml` for production with Nginx reverse proxy

---

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

### SDK JS/TS

```js
import { runAgent, listAgents, healthCheck } from "./.antigravity/sdk/antigravity.js";

const agents = await listAgents();
const result = await runAgent("explorer", "analiza el repo");
```

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
