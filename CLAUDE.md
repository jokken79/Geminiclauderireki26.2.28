# CLAUDE.md - Staffing OS (人材派遣管理システム)

## Project Overview

**Staffing OS** is a comprehensive HR management system for a Japanese staffing/temporary worker dispatch company (人材派遣会社). It manages the full lifecycle of temporary workers: from candidate registration through to active employment as dispatched workers (派遣社員) or contract workers (請負).

The application is bilingual — UI labels and validation messages are in Japanese, code and comments mix Japanese and Spanish/English. Domain terminology is heavily rooted in Japanese labor law.

### Core Modules

| Module | Japanese | Path | Description |
|--------|----------|------|-------------|
| Candidates | 候補者 | `/candidates` | Registration, interview, approval/rejection |
| Hakenshain | 派遣社員 | `/hakenshain` | Dispatched workers assigned to client factories |
| Ukeoi | 請負 | `/ukeoi` | Contract/subcontract workers |
| Nyusha Todoke | 入社届け | `/hakenshain/nyusha` | Onboarding wizard (candidate → employee) |
| Companies | 企業/派遣先 | `/companies` | Client company management |
| Documents | 書類 | `/documents` | Residence cards, passports, licenses |
| OCR | OCRスキャン | `/ocr` | Hybrid multi-provider document scanning |
| Import/Export | インポート/エクスポート | `/import-export` | CSV skill sheet import/export |
| Dashboard | ダッシュボード | `/dashboard` | Alerts, compliance warnings, statistics |
| Settings | 設定 | `/settings` | User management, RBAC, audit logs |

### Explicitly Out of Scope

Do NOT implement: Timecards (タイムカード), Payroll (給与計算), Apartments (社宅管理), Rent deductions (家賃控除).

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Runtime | React | 19.x |
| Language | TypeScript (strict mode) | 5.x |
| CSS | Tailwind CSS | 4.x |
| UI Components | shadcn/ui (new-york style) + Radix UI | - |
| Forms | React Hook Form + Zod | v7 / v4 |
| Tables | TanStack Table | v8 |
| State | Zustand | v5 |
| Charts | Recharts | v3 |
| Icons | Lucide React | - |
| ORM | Prisma | 6.x |
| Database | PostgreSQL (UTF-8, ja_JP locale) | 16+ |
| Auth | NextAuth v5 (beta) with JWT + Credentials | - |
| Image processing | Sharp | - |
| Toasts | Sonner | - |
| Testing | Vitest | v4 |
| Linting | ESLint (next core-web-vitals + typescript) | v9 |
| Formatting | Prettier | v3 |

---

## Project Structure

```
staffing-os/
├── prisma/
│   ├── schema.prisma          # Complete data model (14 models, 8 enums)
│   └── seed.ts                # Database seeder (admin user + sample companies)
├── docker/
│   └── postgres/init.sql      # PostgreSQL extensions (pg_trgm, unaccent)
├── nginx/
│   └── default.conf           # Nginx reverse proxy config
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (lang="ja", Sonner toaster)
│   │   ├── page.tsx           # Landing/redirect page
│   │   ├── globals.css        # Tailwind + CSS variables
│   │   ├── (auth)/
│   │   │   └── login/page.tsx # Login page
│   │   ├── (dashboard)/       # Authenticated dashboard route group
│   │   │   ├── layout.tsx     # Auth guard + DashboardShell wrapper
│   │   │   ├── dashboard-shell.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── candidates/    # CRUD pages + [id]/edit
│   │   │   ├── hakenshain/    # List + detail + nyusha wizard
│   │   │   ├── ukeoi/         # List + detail + new
│   │   │   ├── companies/     # List + detail + new
│   │   │   ├── documents/
│   │   │   ├── ocr/
│   │   │   ├── import-export/
│   │   │   └── settings/      # Users + audit subpages
│   │   └── api/
│   │       └── auth/[...nextauth]/route.ts  # NextAuth API route
│   ├── actions/               # Server Actions (all "use server")
│   │   ├── candidates.ts      # CRUD + status changes
│   │   ├── hakenshain.ts      # Dispatch assignments
│   │   ├── ukeoi.ts           # Contract assignments
│   │   ├── companies.ts       # Client companies
│   │   ├── documents.ts       # Document management
│   │   ├── dashboard.ts       # Dashboard stats & alerts
│   │   ├── users.ts           # User management (RBAC)
│   │   ├── ocr.ts             # OCR processing
│   │   └── import-export.ts   # CSV import/export
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (button, card, input, etc.)
│   │   ├── shared/            # Reusable components (data-table, status-badge)
│   │   ├── layout/            # Header, Sidebar
│   │   ├── candidates/        # Candidate-specific (form, list, status-actions, 9-step wizard)
│   │   ├── hakenshain/        # Hakenshain list, nyusha wizard, teishokubi badge
│   │   ├── ukeoi/             # Ukeoi list, form, status actions
│   │   ├── companies/         # Company form
│   │   ├── documents/         # Document upload/list
│   │   ├── dashboard/         # Alerts panel, recent activity
│   │   ├── ocr/               # OCR scanner
│   │   ├── import-export/     # Export panel
│   │   └── settings/          # User management
│   └── lib/
│       ├── prisma.ts          # Singleton PrismaClient instance
│       ├── auth.ts            # NextAuth config (Credentials provider, JWT)
│       ├── rbac.ts            # Role-based access control + permissions matrix
│       ├── constants.ts       # Role hierarchy, labels, nav items, prefectures
│       ├── utils.ts           # cn() helper (clsx + tailwind-merge)
│       ├── wareki.ts          # Japanese era (和暦) conversion utilities
│       ├── teishokubi.ts      # 3-year dispatch limit calculation (抵触日)
│       └── validators/
│           ├── shared.ts      # Reusable Zod schemas (postal, phone, email, date)
│           ├── candidate.ts   # Candidate form validation schema
│           ├── company.ts     # Company validation schema
│           ├── hakenshain.ts  # Hakenshain validation schema
│           └── ukeoi.ts       # Ukeoi validation schema
├── middleware.ts              # Auth middleware (redirects unauthenticated users)
├── Dockerfile                 # Multi-stage production build (node:20-alpine)
├── docker-compose.yml         # Dev: PostgreSQL 16 + Redis 7
├── docker-compose.prod.yml    # Prod: app + db + redis + nginx
├── components.json            # shadcn/ui configuration
├── next.config.ts             # output: "standalone"
├── tsconfig.json              # strict, path alias @/* → ./src/*
├── eslint.config.mjs          # ESLint flat config
├── postcss.config.mjs         # Tailwind PostCSS
└── .env.example               # Required environment variables
```

---

## Development Commands

All commands run from the `staffing-os/` directory:

```bash
# Install dependencies
npm install

# Start dev server (requires DB running)
npm run dev

# Start database services (PostgreSQL + Redis)
docker compose up -d

# Run Prisma migrations
npm run db:migrate

# Seed the database (creates admin + sample data)
npm run db:seed

# Open Prisma Studio (DB browser)
npm run db:studio

# Reset database (destructive!)
npm run db:reset

# Build for production
npm run build

# Run production server
npm start

# Lint
npm run lint

# Production Docker deployment
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Environment Variables

Copy `.env.example` to `.env.local` for development. Required variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://staffing:staffing_dev_2024@localhost:5432/staffing_os` |
| `AUTH_SECRET` | NextAuth JWT signing secret | Random string |
| `AUTH_URL` | App base URL | `http://localhost:3000` |
| `REDIS_URL` | Redis connection (cache/sessions) | `redis://localhost:6379` |
| `ENCRYPTION_KEY` | AES-256 key for bank account data | 32-byte hex |

Optional OCR provider keys (configure at least one for OCR feature):
- `AZURE_VISION_KEY` / `AZURE_VISION_ENDPOINT`
- `OPENAI_API_KEY`
- `GOOGLE_GEMINI_API_KEY`

---

## Database

### Setup

PostgreSQL 16+ with UTF-8 encoding and Japanese locale. Extensions `pg_trgm` and `unaccent` are initialized via `docker/postgres/init.sql`.

### Key Models

- **User** — Auth with bcrypt hashing, role-based (`UserRole` enum with 8 levels)
- **Candidate** — Central model with 50+ fields (3 name writing systems: kanji, furigana, romaji)
- **HakenshainAssignment** — Dispatched worker assignments with 抵触日 (3-year limit) tracking
- **UkeoiAssignment** — Contract workers with mandatory `internalSupervisor` (偽装請負 prevention)
- **ClientCompany** — Factories/companies where workers are dispatched
- **Document** — File storage as Base64 with expiry tracking
- **SkillSheet** — Anonymized candidate profiles (initials + age range only)
- **Alert** — Compliance alerts (visa expiry, contract expiry, 抵触日)
- **AuditLog / AdminAuditLog** — Full audit trail of all operations

### Migrations

```bash
npx prisma migrate dev --name <description>  # Create migration
npx prisma generate                           # Regenerate client
npx prisma db push                            # Push without migration (dev only)
```

### Seed Users

| Email | Password | Role |
|-------|----------|------|
| admin@staffing-os.jp | admin123 | SUPER_ADMIN |
| tantosha@staffing-os.jp | tantosha123 | TANTOSHA |

---

## Authentication & Authorization

### Auth Flow

- **NextAuth v5** (beta) with Credentials provider
- JWT-based sessions (24h expiry)
- Middleware (`src/middleware.ts`) protects all routes except `/login` and `/api`
- Dashboard layout (`src/app/(dashboard)/layout.tsx`) verifies session server-side

### RBAC (Role-Based Access Control)

Role hierarchy (higher = more permissions):

| Level | Role | Japanese | Description |
|-------|------|----------|-------------|
| 8 | SUPER_ADMIN | スーパー管理者 | Full system access |
| 7 | ADMIN | 管理者 | Settings, user management, audit |
| 6 | KEITOSAN | 経理担当 | Accounting staff |
| 5 | TANTOSHA | 担当者 | Case workers (create/update/approve) |
| 4 | COORDINATOR | コーディネーター | Read-only candidates + companies |
| 3 | KANRININSHA | 管理人者 | Read-only hakenshain/ukeoi/documents |
| 2 | EMPLOYEE | 派遣元社員 | Own data access |
| 1 | CONTRACT_WORKER | 請負社員 | Minimal access |

Use `hasMinRole(userRole, minRole)` from `src/lib/rbac.ts` for permission checks.
Use `requireRole(minRole)` for server-side guards in actions.

---

## Key Domain Concepts

### 抵触日 (Teishokubi) — 3-Year Dispatch Limit

Under Japan's Worker Dispatch Act (労働者派遣法), dispatched workers cannot stay at the same client for more than 3 years. The system auto-calculates this date and raises alerts at 180/90 days before expiry. See `src/lib/teishokubi.ts`.

### 偽装請負 (Gisou-Ukeoi) Prevention

Contract workers (請負) MUST have an internal supervisor (`internalSupervisor` field is required). This prevents illegal "disguised dispatch" where the client company directly supervises contract workers.

### 和暦 (Wareki) — Japanese Era Calendar

Dates are displayed in Japanese era format (令和, 平成, 昭和, etc.) via `src/lib/wareki.ts`. The `toWareki()` and `toWarekiFull()` functions handle conversion.

### Triple Name Writing System

All candidates store names in 3 formats:
1. **Kanji** (漢字) — e.g., 田中太郎 — required
2. **Furigana** (フリガナ) — e.g., タナカタロウ — required
3. **Romaji** — e.g., Tanaka Taro — optional

### Candidate Status Flow

```
PENDING → APPROVED → HIRED (via Nyusha wizard)
       ↘ REJECTED
       ↘ WITHDRAWN
```

---

## Coding Conventions

### General

- **Language**: TypeScript with strict mode. All new code must be fully typed.
- **Path alias**: `@/*` maps to `./src/*` (e.g., `import { prisma } from "@/lib/prisma"`)
- **Server Actions**: All data mutations live in `src/actions/*.ts` with `"use server"` directive
- **Validation**: Zod schemas in `src/lib/validators/`. Always validate on server side.
- **Audit logging**: All create/update/delete/status-change operations must create an `AuditLog` entry within a `prisma.$transaction`.
- **Error messages**: User-facing messages in Japanese. Code comments in English or Spanish.

### Component Patterns

- **UI primitives**: Use shadcn/ui components from `src/components/ui/`. Style is "new-york" variant.
- **Styling**: Tailwind CSS utility classes. Use `cn()` from `src/lib/utils.ts` for conditional classes.
- **Forms**: React Hook Form with Zod resolver. Multi-step wizards use step components in subdirectories.
- **Data tables**: TanStack Table via the shared `DataTable` component (`src/components/shared/data-table.tsx`).
- **Toasts**: Use `sonner` (`toast.success()`, `toast.error()`).
- **Icons**: Lucide React only.

### Server Actions Pattern

Every server action follows this structure:
1. Authenticate with `auth()` — throw if no session
2. Validate input with Zod `.safeParse()`
3. Execute in `prisma.$transaction()` with audit log
4. Call `revalidatePath()` for relevant routes
5. Return `{ success: true }` or `{ error: "Japanese error message" }`

### File Naming

- Pages: `page.tsx` (Next.js convention)
- Components: `kebab-case.tsx` (e.g., `candidate-form.tsx`)
- Server actions: `kebab-case.ts` matching the module name
- Validators: `kebab-case.ts` in `lib/validators/`
- Lib utilities: `kebab-case.ts`

---

## Docker & Deployment

### Development

```bash
docker compose up -d   # Starts PostgreSQL 16 + Redis 7
npm run dev             # Starts Next.js dev server on :3000
```

### Production

Multi-stage Dockerfile (`node:20-alpine`) with standalone Next.js output:
- Stage 1: Install deps
- Stage 2: Build + Prisma generate
- Stage 3: Minimal runner image

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Production stack: Next.js app (:3000) + PostgreSQL + Redis + Nginx reverse proxy (:80/:443).

Nginx config includes security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection) and 20MB upload limit for document files.

---

## Testing

- **Unit tests**: Vitest (configured but test files not yet written)
- **Run tests**: `npx vitest` or `npx vitest run`

---

## Important Notes for AI Assistants

1. **Japanese text handling**: This system deals extensively with Japanese text (kanji, katakana, hiragana). Always preserve correct encoding and display. Never truncate Japanese field values.

2. **Legal compliance**: The 抵触日 (3-year limit) and 偽装請負 prevention are legally mandated. Never remove or weaken these checks.

3. **Audit trail**: Every data mutation MUST be logged. Never bypass `AuditLog` creation in transactions.

4. **Photo format**: Candidate photos follow the Japanese 3x4cm resume photo standard. Photos are stored as Base64 data URLs in the database.

5. **Bank data encryption**: Bank account numbers in Hakenshain/Ukeoi assignments should be encrypted. The `ENCRYPTION_KEY` env var is for AES-256 encryption.

6. **Prisma Client singleton**: Always import from `@/lib/prisma` — never create new `PrismaClient()` instances in application code.

7. **Auth checks**: All server actions and page components must verify the session. Use `auth()` from `@/lib/auth` or `requireRole()` from `@/lib/rbac`.

8. **No force-push to main**: This repo uses feature branches. Always work on the designated branch.

9. **Zod v4 + React Hook Form v7**: The project uses Zod v4 (with `@hookform/resolvers`). Schema definitions use `z.coerce` for numeric form fields.

10. **shadcn/ui additions**: When adding new UI components, use `npx shadcn@latest add <component>` to maintain consistency with the "new-york" style configuration.
