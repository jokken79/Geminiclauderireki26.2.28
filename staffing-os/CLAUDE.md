# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Staffing OS** is a Japanese staffing agency management system (人材派遣管理システム) built for managing candidates, dispatch workers (派遣社員), contract workers (請負), client companies, documents, and compliance workflows. It targets Japanese staffing companies that place foreign workers in manufacturing and logistics roles.

## Commands

All commands must be run from the `staffing-os/` directory.

```bash
# Development
npm run dev              # Start dev server on port 3433 (NOT 3000)
npm run build            # Production build (standalone output for Docker)
npm run lint             # ESLint (eslint-config-next with core-web-vitals + typescript)

# Testing
npm run test             # Vitest (jsdom environment, @testing-library/jest-dom)

# Database
npm run db:migrate       # Run Prisma migrations (prisma migrate dev)
npm run db:seed          # Seed database with default users
npm run db:studio        # Open Prisma Studio GUI
npm run db:reset         # Reset database — DESTRUCTIVE, drops all data
```

### Environment Setup

1. Copy `.env.example` to `.env` (or `.env.local` for development)
2. Start PostgreSQL and Redis: `docker compose up -d`
3. Run migrations: `npm run db:migrate`
4. Seed users: `npm run db:seed`
5. Start dev server: `npm run dev`

Required env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (must use port 3433 for dev).
Optional: `AZURE_VISION_KEY`, `AZURE_VISION_ENDPOINT`, `GOOGLE_GEMINI_API_KEY`, `OPENAI_API_KEY` (for OCR), `ENCRYPTION_KEY` (for bank account encryption).

### Seed Credentials

After `npm run db:seed`, two users are available:

| Email | Password | Role |
|-------|----------|------|
| `admin@staffing-os.jp` | `admin123` | SUPER_ADMIN |
| `tantosha@staffing-os.jp` | `tantosha123` | TANTOSHA |

## Architecture

**Stack:** Next.js 16 (App Router) + Prisma 6 + PostgreSQL 16 + Redis 7 + NextAuth 5 (beta) + TailwindCSS 4 + shadcn/ui + Zustand + react-hook-form + Zod 4 + Recharts + Vitest

**Path alias:** `@/*` maps to `./src/*`

**Node version:** 20 (specified in Dockerfile)

### Directory Structure

```
staffing-os/
├── src/
│   ├── app/
│   │   ├── (auth)/login/           — Login page
│   │   ├── (dashboard)/            — All authenticated routes
│   │   │   ├── candidates/         — Candidate CRUD + multi-step form
│   │   │   ├── candidates/new/     — New candidate (RirekishoForm A4)
│   │   │   ├── candidates/[id]/    — View/edit candidate
│   │   │   ├── companies/          — Client company CRUD
│   │   │   ├── hakenshain/         — Dispatch worker assignments
│   │   │   ├── hakenshain/nyusha/  — New dispatch enrollment flow
│   │   │   ├── ukeoi/              — Contract (請負) assignments
│   │   │   ├── documents/          — Document management
│   │   │   ├── ocr/                — OCR document scanning
│   │   │   ├── import-export/      — CSV import/export
│   │   │   ├── dashboard/          — Dashboard with alerts & charts
│   │   │   └── settings/           — User management & audit logs
│   │   └── api/
│   │       ├── auth/[...nextauth]/ — NextAuth API routes
│   │       └── health/             — Health check endpoint
│   ├── actions/                    — Server Actions (all data mutations)
│   │   ├── candidates.ts
│   │   ├── companies.ts
│   │   ├── hakenshain.ts
│   │   ├── ukeoi.ts
│   │   ├── documents.ts
│   │   ├── users.ts
│   │   ├── dashboard.ts
│   │   ├── import-export.ts
│   │   └── ocr.ts
│   ├── components/
│   │   ├── ui/                     — shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── layout/                 — Sidebar, header, app shell
│   │   ├── shared/                 — DataTable, StatusBadge
│   │   ├── candidates/             — Candidate form, list, rirekisho
│   │   │   └── steps/              — 9-step candidate form wizard
│   │   ├── companies/
│   │   ├── hakenshain/
│   │   ├── ukeoi/
│   │   ├── documents/
│   │   ├── dashboard/
│   │   ├── ocr/
│   │   ├── import-export/
│   │   └── settings/
│   ├── lib/
│   │   ├── auth.ts                 — NextAuth config (Credentials provider, JWT)
│   │   ├── prisma.ts               — Prisma client singleton
│   │   ├── rbac.ts                 — Role-based access control helpers
│   │   ├── constants.ts            — Role hierarchy, nav items, labels, prefectures
│   │   ├── rate-limit.ts           — In-memory rate limiter for middleware
│   │   ├── wareki.ts               — Japanese calendar (Heisei/Reiwa) conversion
│   │   ├── teishokubi.ts           — 3-year dispatch limit calculation
│   │   ├── file-storage.ts         — File storage helpers
│   │   ├── utils.ts                — Tailwind cn() utility
│   │   └── validators/             — Zod schemas by domain
│   │       ├── candidate.ts        — Multi-step candidate form schemas
│   │       ├── company.ts
│   │       ├── hakenshain.ts
│   │       ├── ukeoi.ts
│   │       └── shared.ts           — Postal code, phone, email patterns
│   ├── services/
│   │   ├── ocr-service.ts          — Multi-provider OCR with circuit breaker
│   │   └── skill-sheet-service.ts  — Anonymized skill sheet generation
│   ├── test/
│   │   └── setup.ts                — Vitest setup (jest-dom, Next.js mocks)
│   └── middleware.ts               — Auth redirect + rate limiting
├── prisma/
│   ├── schema.prisma               — Database schema (all models)
│   ├── seed.ts                     — Database seeder
│   └── migrations/                 — Prisma migration history
├── docker/                         — Docker support files (postgres init.sql)
├── nginx/                          — Nginx config for production reverse proxy
├── public/                         — Static assets (UNS company logo)
├── scripts/                        — Utility scripts (start-app.bat)
├── Dockerfile                      — Multi-stage production Docker build
├── docker-compose.yml              — Development (PostgreSQL + Redis)
└── docker-compose.prod.yml         — Production (app + db + redis + nginx)
```

## Data Flow & Conventions

### Server Actions Pattern

All data mutations go through **Server Actions** in `src/actions/`. Every action follows this pattern:

1. `requireRole()` — check RBAC permissions
2. Zod schema validation
3. Prisma query (often in a `$transaction` for multi-table writes)
4. Write to `AuditLog` or `AdminAuditLog`
5. `revalidatePath()` for cache invalidation

### Error Message Language

Error messages in Server Actions are in **Japanese**:
- `"認証が必要です"` — Authentication required
- `"権限がありません"` — Insufficient permissions
- `"候補者が見つかりません"` — Candidate not found

**Maintain this convention** when adding new actions or error messages.

Action files: `candidates.ts`, `companies.ts`, `hakenshain.ts`, `ukeoi.ts`, `documents.ts`, `users.ts`, `dashboard.ts`, `import-export.ts`, `ocr.ts`

### Component Conventions

- UI primitives live in `src/components/ui/` (shadcn/ui — do not modify directly)
- Domain components are organized by feature: `src/components/{domain}/`
- Forms use `react-hook-form` + `zod` resolvers
- Tables use `@tanstack/react-table` via the shared `DataTable` component
- Toast notifications use `sonner`
- Icons use `lucide-react`
- State management uses `zustand` for client-side state

## Authentication & RBAC

- **Provider:** NextAuth 5 with Credentials (bcrypt passwords)
- **Session:** JWT strategy, 24-hour max age
- **Middleware:** `src/middleware.ts` — redirects unauthenticated users to `/login`, rate-limits login and API routes (10 req/min per IP)

### Role Hierarchy (higher number = more permissions)

| Level | Role | Japanese Label |
|-------|------|----------------|
| 8 | SUPER_ADMIN | スーパー管理者 |
| 7 | ADMIN | 管理者 |
| 6 | KEITOSAN | 経理担当 |
| 5 | TANTOSHA | 担当者 |
| 4 | COORDINATOR | コーディネーター |
| 3 | KANRININSHA | 管理人者 |
| 2 | EMPLOYEE | 派遣元社員 |
| 1 | CONTRACT_WORKER | 請負社員 |

### Permission Thresholds

- `candidates:read` → COORDINATOR (level 4)
- `candidates:create/update` → TANTOSHA (level 5)
- `candidates:delete` → ADMIN (level 7)
- `users:manage` → ADMIN (level 7)
- `hakenshain/ukeoi:read` → KANRININSHA (level 3)
- `hakenshain/ukeoi:create` → TANTOSHA (level 5)

Use `requireRole()` from `src/lib/rbac.ts` to enforce role checks inside Server Actions.

## Database

### Schema Overview

**Core models:** `User`, `Candidate`, `ClientCompany`, `HakenshainAssignment`, `UkeoiAssignment`, `Document`, `SkillSheet`, `Alert`, `AuditLog`, `AdminAuditLog`

**Supporting models:** `EducationHistory`, `WorkHistory`, `Qualification`, `FamilyMember`

**Key enums:** `UserRole` (8 roles), `CandidateStatus` (5 states), `VisaStatus` (12 Japanese immigration statuses), `DocumentType` (9 types), `AssignmentStatus` (4 states), `AlertType` (5 types), `JlptLevel` (N1-N5 + NONE)

### Candidate Model

The `Candidate` model is the central entity with 80+ fields organized into sections:
- Name (3 writing systems: Kanji, Furigana, Romaji)
- Personal info (birth date, gender, nationality, physical measurements)
- Contact (postal code, prefecture, address with furigana, phone, email)
- Immigration (passport, residence card, visa status with expiry dates)
- Photo (base64 data URL stored in `@db.Text`)
- Experience checkboxes (10 manufacturing categories)
- Languages (JLPT level, conversation ability)
- Qualifications (driver/forklift/crane/welding licenses)
- Preferences (bento, allergies)
- Interview data
- Emergency contact
- Rirekisho-specific fields (reception date, uniform size, commute info, literacy levels)

### Key Relations

- `Candidate` has many: `EducationHistory`, `WorkHistory`, `Qualification`, `FamilyMember`, `Document`, `HakenshainAssignment`, `UkeoiAssignment`, `SkillSheet`
- `ClientCompany` has many: `HakenshainAssignment`, `UkeoiAssignment`
- `User` has many: `AuditLog`, `AdminAuditLog`
- Cascade deletes on: `EducationHistory`, `WorkHistory`, `Qualification`, `FamilyMember`, `Document`
- Primary keys: CUID (not UUID)

## Japanese-Specific Features

- **Three name systems** on candidates: Kanji (漢字), Furigana (ふりがな), Romaji
- **Japanese calendar:** `src/lib/wareki.ts` — Gregorian to Heisei/Reiwa conversion
- **3-year dispatch limit (抵触日):** `src/lib/teishokubi.ts` — calculates legal max dispatch period
- **47 Japanese prefectures** in `src/lib/constants.ts`
- **JLPT levels** N1-N5 with Japanese labels
- **Rirekisho form:** A4 Japanese resume format (`src/components/candidates/rirekisho-form.tsx`)
- **Gisou-ukeoi prevention (偽装請負防止):** UkeoiAssignment requires `internalSupervisor`

## OCR Integration

`src/services/ocr-service.ts` implements a multi-provider circuit breaker:
1. Azure Computer Vision (primary)
2. Google Gemini Vision (backup)
3. OpenAI Vision (secondary)
4. Demo mode (no API keys required — for development)

Extracts Japanese names, birth dates, visa info from document images.

## Candidate Forms

Two form patterns exist for candidate creation:

1. **Multi-step wizard** (`src/components/candidates/candidate-form.tsx` + `steps/`): 9 steps — basic info, contact, immigration, photo, work history, qualifications, family, other, confirmation.

2. **RirekishoForm** (`src/components/candidates/rirekisho-form.tsx`): Single-page A4 Japanese resume format used at `/candidates/new`. Constants in `rirekisho-constants.ts`.

Each step has matching Zod schemas in `src/lib/validators/candidate.ts`.

## Docker / Production

- `next.config.ts` uses `output: "standalone"` for Docker
- Multi-stage Dockerfile: deps → builder → runner (node:20-alpine)
- `docker-compose.yml`: Development (PostgreSQL 16 + Redis 7)
- `docker-compose.prod.yml`: Full production (app + db + redis + nginx)
- Security headers in `next.config.ts`: X-Frame-Options DENY, X-Content-Type-Options nosniff, strict Referrer-Policy, disabled camera/microphone

## Testing

Vitest is configured with:
- Environment: jsdom
- Setup: `src/test/setup.ts` (mocks `next/navigation`, `ResizeObserver`)
- Path alias: `@` → `./src`
- Coverage: v8 provider
- Existing tests in `src/components/shared/__tests__/`

## Coding Guidelines

1. **Server Actions** are the only way to mutate data — never use API routes for mutations
2. **Always use `requireRole()`** at the top of every Server Action
3. **Always write to AuditLog** after data mutations
4. **Japanese error messages** in Server Actions — maintain consistency with existing patterns
5. **Zod validation** before any Prisma write — schemas live in `src/lib/validators/`
6. **`revalidatePath()`** after mutations to bust the Next.js cache
7. **Use `$transaction`** for multi-table writes in Prisma
8. **shadcn/ui components** in `src/components/ui/` should not be modified directly
9. **Port 3433** for development — do not change to 3000

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
