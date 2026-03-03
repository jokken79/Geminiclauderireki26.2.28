# Análisis de Cobertura de Tests — Staffing OS

**Fecha:** 2026-03-03
**Estado actual:** 1 archivo de test / 109 archivos fuente = **< 1% de cobertura**

## Situación Actual

El proyecto cuenta con una **infraestructura de testing bien configurada** (Vitest + jsdom + React Testing Library + cobertura v8), pero actualmente solo existe **un único archivo de test**:

```
src/components/shared/__tests__/status-badge.test.tsx  →  2 tests (PASSING)
```

### Reporte de cobertura actual

| Archivo            | Statements | Branch | Functions | Lines |
|--------------------|-----------|--------|-----------|-------|
| status-badge.tsx   | 75%       | 100%   | 50%       | 75%   |
| badge.tsx (ui)     | 100%      | 100%   | 100%      | 100%  |
| constants.ts       | 100%      | 100%   | 100%      | 100%  |
| utils.ts           | 100%      | 100%   | 100%      | 100%  |

> **Solo 4 de 109 archivos fuente aparecen en el reporte.** Los demás tienen 0% de cobertura.

---

## Áreas Prioritarias para Mejorar Tests

### 1. Utilidades Puras — PRIORIDAD CRÍTICA ⬆️

Estas funciones son puras (sin efectos secundarios), fáciles de testear y de **alto impacto en la lógica de negocio**:

| Archivo | Funciones | Por qué es crítico |
|---------|-----------|-------------------|
| `lib/wareki.ts` | `toWareki()`, `fromWareki()`, `calculateAge()`, `getAgeRange()` | Conversión de eras japonesas (令和/平成/昭和). Un error aquí afecta fechas en todo el sistema |
| `lib/teishokubi.ts` | `calculateTeishokubi()`, `getTeishokubiSeverity()`, `daysUntilTeishokubi()` | Cálculo del límite de 3 años de despacho (抵触日). Error = incumplimiento legal |
| `lib/rbac.ts` | `hasMinRole()`, `requireRole()`, `PERMISSIONS` | Control de acceso por roles. Error = vulnerabilidad de seguridad |
| `lib/rate-limit.ts` | `rateLimit()`, `checkRateLimit()` | Protección contra ataques de fuerza bruta |

**Esfuerzo estimado:** Bajo. Son funciones puras con entradas/salidas claras.

**Ejemplo de test sugerido para `wareki.ts`:**
```typescript
describe('toWareki', () => {
  it('convierte fecha Reiwa correctamente', () => {
    expect(toWareki(new Date('2024-01-15'))).toBe('令和6年1月15日')
  })
  it('convierte fecha Heisei correctamente', () => {
    expect(toWareki(new Date('2015-06-01'))).toBe('平成27年6月1日')
  })
  it('convierte fecha Showa correctamente', () => {
    expect(toWareki(new Date('1985-03-20'))).toBe('昭和60年3月20日')
  })
})

describe('calculateTeishokubi', () => {
  it('calcula el límite de 3 años desde la fecha de inicio', () => {
    const start = new Date('2024-04-01')
    const result = calculateTeishokubi(start)
    expect(result).toEqual(new Date('2027-04-01'))
  })
})
```

---

### 2. Validadores Zod — PRIORIDAD ALTA ⬆️

Los schemas de validación son la **primera línea de defensa** contra datos inválidos:

| Archivo | Schemas | Por qué es importante |
|---------|---------|----------------------|
| `lib/validators/candidate.ts` | `step1Schema` a `step8Schema`, `candidateSchema` | Validación del formulario de candidatos (80+ campos). Datos incorrectos corrompen toda la base de datos |
| `lib/validators/shared.ts` | `postalCodeSchema`, `phoneSchema`, `emailSchema` | Formatos japoneses específicos (〒, 090-xxxx-xxxx) |
| `lib/validators/company.ts` | `companySchema` | Datos de empresas cliente |
| `lib/validators/hakenshain.ts` | `nyushaSchema`, `hakenshainSchema` | Datos de asignación de despacho |
| `lib/validators/ukeoi.ts` | `ukeoiSchema` | Datos de contratos |

**Esfuerzo estimado:** Bajo-Medio. Los schemas Zod se testean pasando objetos válidos e inválidos.

**Ejemplo:**
```typescript
describe('postalCodeSchema', () => {
  it('acepta formato japonés válido', () => {
    expect(postalCodeSchema.safeParse('123-4567').success).toBe(true)
  })
  it('rechaza formato inválido', () => {
    expect(postalCodeSchema.safeParse('1234567').success).toBe(false)
  })
})
```

---

### 3. Server Actions — PRIORIDAD ALTA ⬆️

Las Server Actions contienen **toda la lógica de mutación de datos**. Son el corazón del sistema:

| Archivo | Acciones | Riesgo |
|---------|----------|--------|
| `actions/candidates.ts` | `createCandidate`, `updateCandidate`, `approveCandidateCandidate`, `deleteCandidateCandidate` | Datos de candidatos (entidad principal del sistema) |
| `actions/hakenshain.ts` | `createHakenshain`, `terminateHakenshain` | Asignaciones de despacho (implicaciones legales) |
| `actions/users.ts` | `createUser`, `updateUser`, `deleteUser` | Gestión de usuarios (seguridad) |
| `actions/companies.ts` | `createCompany`, `updateCompany`, `deleteCompany` | Datos de empresas cliente |
| `actions/documents.ts` | `uploadDocument`, `deleteDocument` | Documentos (pasaportes, visas) |
| `actions/import-export.ts` | `exportCandidates`, `importCandidates` | Importación/exportación masiva de datos |
| `actions/dashboard.ts` | `getAlerts`, `getDashboardStats` | Alertas de vencimientos |

**Esfuerzo estimado:** Medio-Alto. Requieren mocking de Prisma, autenticación y sesión.

**Qué testear en cada action:**
- Verificar que `requireRole()` rechace usuarios sin permisos
- Verificar validación de datos (Zod)
- Verificar que se cree el `AuditLog` correspondiente
- Verificar que se llame `revalidatePath()`
- Verificar manejo de errores (mensajes en japonés)

---

### 4. Servicios — PRIORIDAD MEDIA

| Archivo | Lógica | Riesgo |
|---------|--------|--------|
| `services/ocr-service.ts` | Circuit breaker: Azure → Gemini → OpenAI → Demo | Fallo silencioso podría perder datos del documento |
| `services/skill-sheet-service.ts` | Anonimización de datos (iniciales, rango de edad, prefectura) | Fuga de datos personales si la anonimización falla |

**Esfuerzo estimado:** Medio. Requieren mocking de APIs externas.

---

### 5. Componentes React — PRIORIDAD MEDIA

| Componente | Complejidad | Por qué testearlo |
|------------|-------------|-------------------|
| `components/candidates/candidate-form.tsx` | Alta (9 pasos) | Flujo complejo multi-paso; errores afectan la entrada de datos |
| `components/shared/data-table.tsx` | Media | Componente reutilizable en toda la app |
| `components/hakenshain/teishokubi-badge.tsx` | Baja | Muestra alerta legal crítica (límite de 3 años) |
| `components/dashboard/alerts-panel.tsx` | Media | Alertas de vencimiento de visas/contratos |
| `components/candidates/candidate-status-actions.tsx` | Media | Transiciones de estado (PENDING→APPROVED→HIRED) |
| `components/layout/sidebar.tsx` | Media | Menú dependiente del rol del usuario |

**Esfuerzo estimado:** Medio-Alto. Requieren renderizado con React Testing Library y mocking de contextos.

---

### 6. Middleware — PRIORIDAD MEDIA-BAJA

| Archivo | Lógica |
|---------|--------|
| `middleware.ts` | Rate limiting + redirección de autenticación |

---

## Plan de Acción Recomendado

### Fase 1 — Fundación (semana 1-2)
1. **Utilidades puras** (`wareki.ts`, `teishokubi.ts`, `rbac.ts`, `rate-limit.ts`)
2. **Validadores Zod** (todos los schemas en `lib/validators/`)
3. Configurar **umbrales de cobertura** en `vitest.config.ts`

### Fase 2 — Lógica de Negocio (semana 3-4)
4. **Server Actions** (empezar por `candidates.ts` y `users.ts`)
5. **Servicios** (`ocr-service.ts`, `skill-sheet-service.ts`)

### Fase 3 — Interfaz (semana 5-6)
6. **Componentes compartidos** (`data-table.tsx`, `status-badge.tsx` completo)
7. **Componentes de formularios** (`candidate-form.tsx`, `company-form.tsx`)
8. **Layout** (`sidebar.tsx`, `header.tsx`)

### Fase 4 — Integración (semana 7+)
9. **Flujos end-to-end**: Candidato → Aprobación → Asignación de despacho
10. **Tests de regresión** para transiciones de estado

---

## Configuración Recomendada de Umbrales

```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    statements: 60,
    branches: 60,
    functions: 60,
    lines: 60,
  },
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/components/ui/**',      // shadcn/ui (no modificar)
    'src/test/**',               // setup de tests
    'src/**/*.d.ts',             // declaraciones de tipos
  ],
}
```

---

## Resumen

| Categoría | Archivos sin test | Prioridad | Esfuerzo |
|-----------|------------------|-----------|----------|
| Utilidades puras | 4 archivos | CRÍTICA | Bajo |
| Validadores Zod | 5 archivos | Alta | Bajo-Medio |
| Server Actions | 9 archivos | Alta | Medio-Alto |
| Servicios | 2 archivos | Media | Medio |
| Componentes React | ~20 archivos | Media | Medio-Alto |
| Middleware | 1 archivo | Media-Baja | Bajo |
| **Total** | **~41 archivos sin cobertura** | | |

> **Conclusión:** El proyecto tiene una excelente infraestructura de testing pero prácticamente no tiene tests. Las utilidades puras y los validadores Zod son el punto de partida ideal: alto impacto, bajo esfuerzo, y protegen la lógica más crítica del sistema (fechas japonesas, límites legales, y validación de datos).
