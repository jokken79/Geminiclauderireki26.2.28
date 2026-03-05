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
Optional: `ENCRYPTION_KEY` (for bank account encryption).
Note: OCR uses **PaddleOCR** (via `@gutenye/ocr-node` ONNX) locally — no cloud API keys needed. See OCR section below.

### Seed Credentials

After `npm run db:seed`, two users are available:

| Email | Password | Role |
|-------|----------|------|
| `admin@staffing-os.jp` | `admin123` | SUPER_ADMIN |
| `tantosha@staffing-os.jp` | `tantosha123` | TANTOSHA |

## Architecture

**Stack:** Next.js 16 (App Router) + Prisma 6 + PostgreSQL 16 + Redis 7 + NextAuth 5 (beta) + TailwindCSS 4 + shadcn/ui + Zustand + react-hook-form + Zod 4 + Recharts + Vitest + @gutenye/ocr-node (PaddleOCR ONNX) + mrz

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
│   │   ├── ocr-service.ts          — Local OCR with Tesseract.js + MRZ parser
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
├── scripts/
│   ├── ocr-worker.mjs              — OCR worker (PaddleOCR, runs as child process)
│   └── start-app.bat               — Utility script
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
- `ocr:scan` → TANTOSHA (level 5)

Use `requireRole()` from `src/lib/rbac.ts` to enforce role checks inside Server Actions.

## Database

### Schema Overview

**Core models:** `User`, `Candidate`, `ClientCompany`, `HakenshainAssignment`, `UkeoiAssignment`, `Document`, `SkillSheet`, `Alert`, `AuditLog`, `AdminAuditLog`

**Supporting models:** `EducationHistory`, `WorkHistory`, `Qualification`, `FamilyMember`

**Key enums:** `UserRole` (8 roles), `CandidateStatus` (5 states), `VisaStatus` (18 Japanese immigration statuses), `DocumentType` (9 types), `AssignmentStatus` (4 states), `AlertType` (5 types), `JlptLevel` (N1-N5 + NONE)

**VisaStatus enum** includes: `PERMANENT_RESIDENT`, `SPOUSE_OF_JAPANESE`, `LONG_TERM_RESIDENT`, `DESIGNATED_ACTIVITIES`, `ENGINEER_HUMANITIES` (技術・人文知識・国際業務), `CULTURAL_ACTIVITIES` (文化活動), `HIGHLY_SKILLED_1/2` (高度専門職), `INTRA_COMPANY_TRANSFER` (企業内転勤), `NURSING_CARE` (介護), `TECHNICAL_INTERN_1/2/3`, `SPECIFIED_SKILLED_1/2`, `STUDENT`, `DEPENDENT`, `OTHER`. When `OTHER` is selected, a free-text field `visaStatusOther` stores custom visa types.

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

**Local OCR** using **PaddleOCR** (via `@gutenye/ocr-node` ONNX runtime). No cloud API keys, no Python needed.

Previously used Tesseract.js but it had very low accuracy (~10-32%) for Japanese ID documents. PaddleOCR achieves **78-97% accuracy** on the same images. The legacy `src/services/ocr-service.ts` (Tesseract) is still in the codebase but no longer used.

### Architecture: Child Process Pattern

**CRITICAL:** PaddleOCR (and Tesseract.js) cannot run inside Next.js Turbopack server actions because the bundler breaks ONNX/WASM worker threads. The solution is a **child process worker**:

```
Browser → Server Action (src/actions/ocr.ts)
             → child_process.execFile("node", ["scripts/ocr-worker.mjs"])
                  → @gutenye/ocr-node (PaddleOCR ONNX)
                  → stdout: JSON result
```

The server action sends image base64 via **stdin** and receives JSON via **stdout**. This pattern works with any bundler (Turbopack, Webpack, Vite) because the worker runs as raw Node.js.

### Supported Documents
- **在留カード (Residence Card):** Extracts name (romaji), nationality, birth date, gender, visa status (18 types), visa expiry, residence card number, address (prefecture + city). Also attempts MRZ zone parsing (TD1 format) via `mrz` package.
- **免許証 (Driver's License):** Extracts name (kanji), prefecture, city, license number (12 digits), license type, expiry date. Handles 和暦→西暦 (Showa/Heisei/Reiwa) conversion.

### OCR Flow
1. User uploads photo at `/ocr` (requires TANTOSHA role)
2. Server action spawns `scripts/ocr-worker.mjs` as child process
3. PaddleOCR runs text detection + recognition (ONNX, ~1 second)
4. Document type auto-detected (在留カード vs 免許証) from recognized text
5. Field extraction via regex patterns on OCR text lines
6. For 在留カード, MRZ zone is also parsed with `mrz` package
7. User reviews/edits extracted fields in the UI
8. Click "この内容で履歴書に反映" → navigates to `/candidates/new?params...`
9. RirekishoForm reads `searchParams` and auto-fills all matching fields

### Key Files
- `scripts/ocr-worker.mjs` — **Main OCR engine**: PaddleOCR + field extraction + MRZ parsing. Runs as standalone Node.js process.
- `src/actions/ocr.ts` — Server action: spawns worker via `child_process.execFile`, sends base64 via stdin, receives JSON via stdout. 60s timeout.
- `src/components/ocr/ocr-scanner.tsx` — Upload UI, scan button, editable result fields, confidence display, raw text toggle, "apply to form" button.
- `src/services/ocr-service.ts` — Legacy Tesseract.js service (kept for reference, not actively used).
- `src/components/candidates/rirekisho-form.tsx` — Reads OCR data from URL query params via `useSearchParams()`.

### npm Packages for OCR
- `@gutenye/ocr-node` — PaddleOCR ONNX wrapper for Node.js (detection + recognition)
- `onnxruntime-node` — ONNX Runtime native bindings (peer dependency)
- `mrz` — Machine Readable Zone parser for ID documents
- `tesseract.js` — Legacy OCR (kept as fallback, low accuracy for Japanese)

### next.config.ts
These packages must be listed in `serverExternalPackages` to prevent Turbopack from bundling them:
```ts
serverExternalPackages: ["tesseract.js", "@gutenye/ocr-node", "onnxruntime-node"]
```

### Reusing This OCR in Another Project
1. `npm install @gutenye/ocr-node onnxruntime-node mrz`
2. Copy `scripts/ocr-worker.mjs` — it's self-contained
3. From your server action or API route, call it via `child_process.execFile("node", ["scripts/ocr-worker.mjs"])`, send base64 image via stdin, read JSON from stdout
4. First run downloads PaddleOCR ONNX models (~4MB) to `~/.cache/gutenye-ocr/`
5. Add `@gutenye/ocr-node` and `onnxruntime-node` to `serverExternalPackages` in Next.js config

## Candidate Forms

Two form patterns exist for candidate creation:

1. **Multi-step wizard** (`src/components/candidates/candidate-form.tsx` + `steps/`): 9 steps — basic info, contact, immigration, photo, work history, qualifications, family, other, confirmation.

2. **RirekishoForm** (`src/components/candidates/rirekisho-form.tsx`): Single-page A4 Japanese resume format used at `/candidates/new`. Constants in `rirekisho-constants.ts`.

Each step has matching Zod schemas in `src/lib/validators/candidate.ts`.

### RirekishoForm Features
- **Photo** positioned on the right side (traditional Japanese 履歴書 layout)
- **Print-optimized:** Sidebar and header are hidden via `print:hidden`. The form renders as a clean A4 page with `@media print` styles. The company logo uses `mix-blend-multiply` for transparent background.
- **Select-based measurements:** Height (145-190cm), weight (35-105kg), waist (55-110cm), shoe size (22.0-30.0cm), vision (0.0-1.5 scale) — all with units in options (e.g., `162cm`, `60kg`)
- **OCR integration:** Reads URL `searchParams` to pre-fill fields from OCR scan results
- **Postal code auto-lookup:** Uses `zipcloud.ibsnet.co.jp` API to auto-fill prefecture/city
- **Visa selector:** 18 visa types + free-text "その他" input for unlisted visas

## Docker / Production

- `next.config.ts` uses `output: "standalone"` for Docker
- Multi-stage Dockerfile: deps → builder → runner (node:20-alpine)
- `docker-compose.yml`: Development (PostgreSQL 16 + Redis 7)
- `docker-compose.prod.yml`: Full production (app + db + redis + nginx)
- Security headers in `next.config.ts`: X-Frame-Options DENY, X-Content-Type-Options nosniff, strict Referrer-Policy, disabled camera/microphone

## Testing

```bash
npm run test                                         # Vitest in watch mode (interactive dev)
npx vitest run                                       # Single run (CI-friendly, no watch)
npx vitest run src/lib/__tests__/wareki.test.ts      # Run a single test file
npx vitest run src/lib/validators                    # Run all tests in a directory
npx vitest --coverage                                # Run with v8 coverage report
```

- Environment: jsdom with `globals: true` (no need to import `describe`/`it`/`expect`)
- Setup: `src/test/setup.ts` — mocks `next/navigation` (useRouter, usePathname, useSearchParams) and `ResizeObserver`
- Path alias: `@` → `./src`
- Coverage excludes `src/components/ui/**` (shadcn/ui primitives)
- Tests use co-located `__tests__/` directories next to the code they test (e.g., `src/lib/__tests__/`, `src/actions/__tests__/`, `src/services/__tests__/`)

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
