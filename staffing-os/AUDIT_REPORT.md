# 🔍 AUDITORÍA COMPLETA — Staffing OS
## Sistema de Gestión de Personal (人材派遣管理システム)
**Fecha:** 2026-03-04 | **Versión:** 1.0 | **Auditor:** Claude Opus 4.6 (6 agentes paralelos)

---

## RESUMEN EJECUTIVO

| Área | Grado | Hallazgos Críticos | Estado |
|------|-------|---------------------|--------|
| **Seguridad** | D+ | 4 CRITICAL, 7 HIGH | ⛔ Requiere acción inmediata |
| **Arquitectura** | A- | Sólida, bien organizada | ✅ Buena |
| **Calidad de Código** | B+ | 1 bug crítico en OCR | ⚠️ Necesita mejoras |
| **Dependencias** | A | 0 vulnerabilidades | ✅ Limpia |
| **Base de Datos** | B | Datos bancarios sin encriptar | ⚠️ Necesita mejoras |
| **Rendimiento** | C+ | Base64 photos, 0 Suspense | ⚠️ Necesita optimización |

**Score General: 68/100 — Necesita remediación antes de producción**

---

## 1. SEGURIDAD (21 hallazgos)

### 🔴 CRITICAL (4)

| # | Hallazgo | Archivo | Línea | OWASP |
|---|----------|---------|-------|-------|
| S1 | Credenciales demo hardcoded visibles en login | `src/app/(auth)/login/page.tsx` | 153-154 | A02/A04 |
| S2 | API keys en URL query params (Google Gemini) | `src/services/ocr-service.ts` | 145, 203 | A02/A06 |
| S3 | Credenciales DB por defecto en docker-compose | `docker-compose.yml` | 6-8 | A02/A05 |
| S4 | Passwords hardcoded en seed file | `prisma/seed.ts` | 10, 24 | A02/A04 |

### 🟠 HIGH (7)

| # | Hallazgo | Archivo | Impacto |
|---|----------|---------|---------|
| S5 | RBAC faltante en operaciones de lectura | `src/actions/candidates.ts:174-228` | Cualquier usuario autenticado accede a todos los candidatos |
| S6 | RBAC faltante en documentos | `src/actions/documents.ts:13-22` | Usuarios no autorizados pueden subir/borrar docs |
| S7 | RBAC faltante en empresas | `src/actions/companies.ts:12-59` | Sin control de acceso por rol |
| S8 | RBAC faltante en hakenshain/ukeoi | `src/actions/hakenshain.ts`, `ukeoi.ts` | Asignaciones sin restricción de rol |
| S9 | RBAC faltante en exportaciones CSV | `src/actions/import-export.ts:11` | Cualquier usuario exporta PII masivamente |
| S10 | Sin validación de parámetros de búsqueda | `src/actions/candidates.ts:192-201` | DoS vía queries costosas |
| S11 | Mensajes de error revelan información interna | `src/app/api/health/route.ts:18-25` | Fuga de datos del sistema |

### 🟡 MEDIUM (8)

| # | Hallazgo | Archivo |
|---|----------|---------|
| S12 | Falta Content-Security-Policy (CSP) | `next.config.ts:5-17` |
| S13 | Console.error puede filtrar PII | Todos los actions |
| S14 | Rate limiter en memoria (bypaseable) | `src/middleware.ts:10-14` |
| S15 | Health check usa endpoint de auth | `docker-compose.prod.yml:25` |
| S16 | Sesión JWT de 24h (muy larga) | `src/lib/auth.ts:62-65` |
| S17 | Validación de archivos insuficiente | `src/lib/file-storage.ts:28-33` |
| S18 | Headers de seguridad faltantes en Nginx | `nginx/default.conf:9-13` |
| S19 | CSV injection (inyección de fórmulas Excel) | `src/actions/import-export.ts:69-71` |

### 🟢 LOW (2)

| # | Hallazgo | Archivo |
|---|----------|---------|
| S20 | Credenciales demo en builds de producción | `login/page.tsx:153-154` |
| S21 | Sin audit logging en exportaciones | `import-export.ts:11` |

---

## 2. ARQUITECTURA

### Fortalezas ✅
- **Server Actions para mutaciones** — Toda escritura de datos pasa por server actions
- **RBAC implementado** (parcialmente) — `requireRole()` existe pero no se aplica en todas las operaciones
- **Audit logging comprehensivo** — Todas las mutaciones escriben a AuditLog
- **Transacciones DB** — Multi-table writes usan `$transaction`
- **Validación Zod** — Todos los formularios validan con schemas Zod antes de enviar
- **Localización japonesa** — Mensajes de error en japonés, soporte 3 sistemas de nombres

### Estructura del Proyecto
```
staffing-os/src/
├── actions/          — 8 Server Action files (candidates, hakenshain, ukeoi, etc.)
├── app/              — Next.js App Router (12 routes)
│   ├── (auth)/       — Login page
│   └── (dashboard)/  — All dashboard routes
├── components/       — 70+ React components
│   ├── candidates/   — Forms, lists, OCR
│   ├── dashboard/    — Stats, charts
│   ├── layout/       — Sidebar, shell
│   └── shared/       — DataTable, badges
├── hooks/            — useDebounce
├── lib/              — Auth, Prisma, RBAC, validators, constants
└── services/         — OCR service (multi-provider)
```

### Áreas de Mejora ❌
- DashboardShell como client component fuerza hydración de todo el subtree
- Sin Suspense boundaries (0 detectados)
- Sin structured logging (usa console.error)
- Sin middleware de monitoring/observabilidad

---

## 3. CALIDAD DE CÓDIGO

### Score por Categoría

| Categoría | Grado | Hallazgos |
|-----------|-------|-----------|
| TypeScript | B | 1 `as any`, strict mode habilitado |
| React Patterns | B+ | 1 crítico (component en render) |
| Dead Code | B | 8 imports no usados |
| Duplicación | C+ | 3-4 áreas de duplicación significativa |
| Naming | A | Excelente consistencia |
| Error Handling | B- | Todos los errores capturados, logging necesita mejora |
| Testing | **D** | **< 1% coverage (4 de 109 archivos)** |
| Linting | B- | 2 errores, 17 warnings |

### Bugs Críticos

1. **Component creado durante render** — `src/components/ocr/ocr-scanner.tsx:79-95`
   - `EditableField` se define dentro del render → se recrea en cada render → pierde estado
   - **Fix:** Mover fuera del componente

2. **Type cast `as any`** — `src/components/candidates/rirekisho-form.tsx:50`
   - `resolver: zodResolver(candidateSchema) as any`
   - **Fix:** Tipar correctamente el resolver

### Testing ⚠️ CRÍTICO

| Área | Archivos | Cobertura | Prioridad |
|------|----------|-----------|-----------|
| Utilidades (wareki, teishokubi, rbac) | 4 | 0% | CRÍTICA |
| Validadores Zod | 5 | 0% | ALTA |
| Server Actions | 8 | 0% | ALTA |
| Componentes React | 70+ | ~1% | MEDIA |
| OCR Service | 1 | 0% | MEDIA |

---

## 4. DEPENDENCIAS

### Estado General: ✅ LIMPIA

| Métrica | Valor |
|---------|-------|
| Dependencias producción | 24 |
| Dependencias desarrollo | 17 |
| Total transitivas | 770 |
| **Vulnerabilidades conocidas** | **0** |
| Paquetes deprecados | 0 |
| Licencias copyleft (GPL/AGPL) | 0 |

### Acciones Recomendadas

| Prioridad | Acción |
|-----------|--------|
| HIGH | Mover `prisma` de dependencies a devDependencies |
| HIGH | Monitorear `next-auth` v5 para release estable (actualmente beta.30) |
| MEDIUM | Actualizar `react`/`react-dom` 19.2.3 → 19.2.4 |
| MEDIUM | Evaluar migración a Prisma 7 (major version) |
| LOW | Remover `@radix-ui/react-slot` (redundante con `radix-ui` meta-package) |

---

## 5. BASE DE DATOS

### Esquema: 15 modelos, 35+ índices, 8 enums

### Hallazgos Críticos

| # | Hallazgo | Severidad | Archivo |
|---|----------|-----------|---------|
| DB1 | Números de cuenta bancaria sin encriptar (PCI DSS) | HIGH | `schema.prisma:403,452` |
| DB2 | `deleteCandidate()` sin verificación de rol | HIGH | `candidates.ts:457` |
| DB3 | Empresa carga assignments ilimitados | MEDIUM | `companies.ts:125` |
| DB4 | Candidatos con asignaciones no se pueden borrar (FK RESTRICT) | MEDIUM | `candidates.ts:468` |
| DB5 | Passwords en seed file en git | MEDIUM | `seed.ts:10,24` |
| DB6 | Índices compuestos faltantes para dashboard | MEDIUM | `dashboard.ts:35-72` |
| DB7 | IP address nunca capturada en audit logs | LOW | Todos los actions |
| DB8 | Update de candidato recrea registros hijos (delete+create) | LOW | `candidates.ts:320-323` |
| DB9 | Sin patrón soft-delete | LOW | Todos los modelos |

### Fortalezas ✅
- Todas las mutaciones usan `$transaction()`
- Audit logging comprehensivo (CREATE/UPDATE/DELETE)
- `Promise.all()` para queries paralelas en dashboard
- Prisma singleton pattern correcto
- Versión de campos para optimistic locking

### Índices Faltantes Recomendados
```prisma
@@index([status, teishokubiDate])    // HakenshainAssignment
@@index([status, visaExpiry])         // Candidate
@@index([expiryDate, type])           // Document
```

---

## 6. RENDIMIENTO

### Score por Categoría

| Categoría | Estado | Prioridad |
|-----------|--------|-----------|
| Bundle Size | Sin optimización | HIGH |
| **Imágenes** | **Base64 en DB (crítico)** | **CRITICAL** |
| Caching | Parcial (revalidatePath sí, ISR no) | MEDIUM |
| Server Components | 42 client components, sobre-hydración | HIGH |
| Data Fetching | Paralelo bueno, N+1 en listas | MEDIUM |
| Rendering | 0 Suspense boundaries | MEDIUM |
| DB Queries | Sin índices en campos de búsqueda | HIGH |
| Static Generation | Todo dinámico | MEDIUM |

### Top 5 Problemas de Rendimiento

1. **Photos como Base64 en DB** — `photoDataUrl` almacena ~200KB por candidato directamente en la base de datos, se transmite en cada carga de lista
2. **42 "use client" components** — DashboardShell fuerza todo el subtree a ser client-rendered
3. **0 Suspense boundaries** — Sin streaming, toda la página espera
4. **Sin dynamic imports** — `rirekisho-form.tsx` (833 líneas) se carga eager
5. **Sin ISR** — Dashboard re-queries DB en cada page load

---

## 7. PLAN DE REMEDIACIÓN

### 🔴 Sprint 1 — INMEDIATO (Seguridad Crítica)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Remover credenciales hardcoded del login page | 30 min | Elimina exposición de passwords |
| 2 | Mover API keys de URL params a request body | 1h | Elimina fuga de API keys |
| 3 | Remover credenciales por defecto de docker-compose | 30 min | Seguridad de DB |
| 4 | Gate seed passwords con env vars | 1h | Elimina passwords en git |
| 5 | Implementar RBAC en TODAS las operaciones de lectura | 4h | Cierra broken access control |
| 6 | Fix OCR EditableField (mover fuera de render) | 30 min | Elimina bug de pérdida de estado |

### 🟠 Sprint 2 — ALTA PRIORIDAD

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 7 | Agregar CSP y HSTS headers | 1h | XSS prevention |
| 8 | Implementar encriptación de datos bancarios | 4h | PCI DSS compliance |
| 9 | Agregar validación de búsqueda | 1h | Previene DoS |
| 10 | Reducir JWT maxAge a 8h | 15 min | Seguridad de sesión |
| 11 | Migrar fotos de Base64 a file system + Next/Image | 8h | Performance +50% |
| 12 | Agregar índices compuestos en Prisma schema | 1h | Query speed 10-100x |
| 13 | Escribir tests para utilidades (wareki, teishokubi, rbac) | 4h | Coverage de lógica crítica |

### 🟡 Sprint 3 — MEJORAS

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 14 | CSV injection prevention | 1h | Data integrity |
| 15 | Migrar rate limiter a Redis | 4h | Escalabilidad |
| 16 | Convertir DashboardShell a server component | 4h | Bundle size -30% |
| 17 | Agregar Suspense boundaries | 2h | Streaming/UX |
| 18 | Dynamic imports para forms pesados | 2h | Initial load -40% |
| 19 | Implementar ISR en dashboard | 1h | Reduce DB load |
| 20 | Refactorizar error handling duplicado | 2h | Mantenibilidad |
| 21 | Remover imports no usados | 30 min | Code cleanup |
| 22 | Audit logging en exportaciones | 1h | Compliance |
| 23 | Tests para validadores y server actions | 8h | Coverage > 30% |

---

## 8. MÉTRICAS DEL CODEBASE

| Métrica | Valor |
|---------|-------|
| Líneas de código (TS/TSX) | ~14,528 |
| Componentes React | 70+ |
| Server Actions | 8 archivos |
| Client Components ("use client") | 42 |
| Modelos Prisma | 15 |
| Enums | 8 |
| Índices DB | 35+ |
| Archivos de test | 1 (2 tests passing) |
| **Test Coverage** | **0.92%** |
| Vulnerabilidades npm | 0 |
| Dependencias totales | 770 |

---

## 9. CONCLUSIÓN

Staffing OS tiene una **arquitectura sólida y bien diseñada** con buen uso de Next.js App Router, Server Actions, Prisma transactions, y validación Zod. Sin embargo, **no está listo para producción** debido a:

1. **4 vulnerabilidades de seguridad CRÍTICAS** (credenciales expuestas, API keys en URLs)
2. **RBAC incompleto** — Las operaciones de lectura no verifican roles
3. **< 1% test coverage** — Lógica de negocio crítica sin tests
4. **Fotos como Base64** — Impacto severo en rendimiento

**Estimación para producción-ready:** 3-4 sprints de remediación (6-8 semanas)

---

*Reporte generado por 6 agentes especializados ejecutados en paralelo:*
*Seguridad | Arquitectura | Calidad | Dependencias | Base de Datos | Rendimiento*
