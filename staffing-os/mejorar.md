# Staffing OS - Auditoría Completa y Plan de Mejoras

**Fecha:** 2026-03-01
**Auditor:** Claude Opus 4.6 + Antigravity Skills (architect-review, accessibility-audit)
**Verificado con:** Context7 (documentación actualizada)

---

## 1. ESTADO DE DEPENDENCIAS (Context7 Verified)

### Dependencias al día

| Paquete | Versión actual | Última verificada | Estado |
|---------|---------------|-------------------|--------|
| Next.js | 16.1.6 | 16.1.6 | AL DIA |
| React | 19.2.3 | 19.2.x | AL DIA |
| Prisma | 6.19.2 | 6.19.x | AL DIA |
| Tailwind CSS | 4.x | 4.x | AL DIA |
| Zod | 4.3.6 | 4.x stable | AL DIA |
| react-hook-form | 7.71.2 | 7.x latest | AL DIA |
| Zustand | 5.0.11 | 5.x | AL DIA |
| Recharts | 3.7.0 | 3.x | AL DIA |
| TypeScript | 5.x | 5.x | AL DIA |
| Vitest | 4.0.18 | 4.x | AL DIA |

### Advertencias de dependencias

| Paquete | Problema | Accion recomendada |
|---------|----------|-------------------|
| `next-auth` | `5.0.0-beta.30` - Sigue en BETA | Monitorear release estable. Funcional pero sin soporte LTS |
| `@auth/prisma-adapter` | `2.11.1` - Acoplado a beta de NextAuth | Actualizar junto con NextAuth cuando salga v5 estable |
| `bcryptjs` | `3.0.3` - OK pero considerar alternativas | `@node-rs/argon2` es 10x mas rapido con WASM nativo |
| `sharp` | `0.34.5` - Pesado para Docker | Verificar que el Dockerfile use multi-stage para no inflar imagen |

### Cambios breaking de Zod 4 a vigilar

```typescript
// DEPRECADO en Zod 4 - revisar validators/
z.string().min(5, { message: "..." })  // Usar { error: "..." }
.strict()                               // Usar z.strictObject()
.passthrough()                          // Usar z.looseObject()
```

**Accion:** Revisar `src/lib/validators/*.ts` y migrar sintaxis deprecated de Zod 3 a Zod 4.

---

## 2. ARQUITECTURA - PROBLEMAS CRITICOS

### 2.1 Sin Tests (CRITICO)

**Estado:** Vitest instalado como devDependency pero sin configuracion ni tests.

- 0 tests unitarios
- 0 tests de integracion
- 0 tests e2e
- Sin cobertura de codigo

**Impacto:** Cualquier refactor o feature nueva puede romper funcionalidad existente sin que nadie lo note.

**Plan de accion:**
```
1. Configurar vitest.config.ts con path aliases
2. Tests unitarios para:
   - src/lib/validators/*.ts (Zod schemas)
   - src/lib/wareki.ts (conversion calendario japones)
   - src/lib/teishokubi.ts (calculo limite 3 anos)
   - src/lib/rbac.ts (permisos por rol)
3. Tests de integracion para Server Actions (con mock de Prisma)
4. Tests e2e con Playwright para flujos criticos:
   - Login/logout
   - Crear candidato (8 pasos)
   - Asignar hakenshain
```

### 2.2 Sin Error Boundaries

No hay `error.tsx` en ningun route group. Si un Server Component falla, el usuario ve un error generico de Next.js.

**Accion:** Crear `error.tsx` en:
- `src/app/(dashboard)/error.tsx`
- `src/app/(dashboard)/candidates/error.tsx`
- `src/app/global-error.tsx`

### 2.3 Sin Loading States

No hay `loading.tsx` en las rutas. La navegacion entre paginas no muestra feedback visual.

**Accion:** Crear `loading.tsx` con skeletons en las rutas principales.

### 2.4 Inconsistencia en formularios

- **Candidatos:** Usa `react-hook-form` + FormProvider (correcto)
- **Empresas:** Usa `useState` manual (inconsistente)
- **Ukeoi:** Usa `react-hook-form` (correcto)

**Accion:** Migrar `company-form.tsx` a `react-hook-form` para consistencia.

### 2.5 Notificacion Bell hardcodeada

```tsx
// header.tsx:37 - HARDCODED "3"
<span className="...">3</span>
```

**Accion:** Conectar a datos reales de alertas o remover.

### 2.6 Ruta /reports sin implementar

El sidebar tiene enlace a `/reports` pero no existe la pagina (`src/app/(dashboard)/reports/`).

**Accion:** Crear pagina o eliminar del sidebar.

---

## 3. SEGURIDAD

### 3.1 Problemas detectados

| # | Problema | Severidad | Ubicacion |
|---|---------|-----------|-----------|
| S1 | Fotos de candidatos almacenadas como base64 en DB | MEDIA | `schema.prisma` (photoDataUrl) |
| S2 | Documentos almacenados como base64 en DB | ALTA | `schema.prisma` (Document.fileData) |
| S3 | Sin rate limiting en login | ALTA | `src/app/(auth)/login/page.tsx` |
| S4 | Sin CSRF token explicito en formularios | BAJA | Server Actions ya incluyen CSRF en Next.js |
| S5 | `signIn("credentials", { redirect: false })` sin throttling | MEDIA | Login page |
| S6 | Sin Content-Security-Policy headers | MEDIA | `next.config.ts` |
| S7 | Sin validacion de tamano de archivo en upload | ALTA | OCR/Document upload |

### 3.2 Acciones recomendadas

**S1/S2 - Archivos en base64 en DB:**
```
PROBLEMA: Base64 inflates datos ~33%. Una DB con 1000 docs de 5MB = 6.5GB solo en archivos.
SOLUCION: Migrar a almacenamiento en filesystem o S3/MinIO.
  - Guardar solo la ruta del archivo en DB
  - Usar presigned URLs para acceso seguro
  - Implementar limites de tamano (ej: 10MB max)
```

**S3 - Rate limiting:**
```
SOLUCION: Implementar rate limiting con:
  - upstash/ratelimit (serverless-compatible)
  - O middleware custom con Map en memoria
  - Limite: 5 intentos / 15 minutos por IP
  - Bloqueo temporal de 30 min despues de 10 intentos
```

**S6 - Security headers:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=()" },
      ],
    },
  ],
}
```

---

## 4. UI/UX - PROBLEMAS DE DISENO (Tu principal queja)

### 4.1 Login Page - Generico y aburrido

**Problemas actuales:**
- Sin logo/branding - solo texto "Staffing OS"
- Fondo `bg-muted/50` = gris ultra sutil, parece sin diseno
- Sin gradiente, sin imagen de fondo, sin personalidad
- Sin toggle de visibilidad de password
- Sin credenciales de demo visibles
- Card `max-w-md` (448px) demasiado ancha para solo 2 campos

**Propuesta de rediseno:**
```
LAYOUT: Split-screen (2 columnas)
  - Izquierda (60%): Gradiente azul-indigo con ilustracion/patron
    - Logo grande de Staffing OS
    - Tagline: "人材派遣管理をシンプルに"
    - Features bullets con iconos
  - Derecha (40%): Form de login centrado
    - Avatar/icon arriba del form
    - Campos con iconos inline (Mail, Lock)
    - Toggle show/hide password
    - Boton con gradiente primario
    - Footer: credenciales de demo en texto pequeno

COLORES: Gradiente primary -> accent (no gris plano)
ANIMACION: Fade-in suave al cargar
```

### 4.2 Sidebar - Rigido y sin personalidad

**Problemas actuales:**
- Ancho fijo de 256px, no colapsable
- Logo = letra "S" en cuadrado negro - nada memorable
- Sin separacion visual entre grupos de menu
- Sin indicador de submenu para Settings
- No responsive (desaparece en mobile? No, se rompe)
- Colores: blanco/gris sin acento de marca

**Propuesta de rediseno:**
```
MEJORAS:
1. Sidebar colapsable (icon-only mode)
   - Toggle con ChevronLeft/ChevronRight
   - Estado persistido en localStorage
   - Animacion con transition-all duration-300

2. Agrupacion de menu:
   [PRINCIPAL]
   - Dashboard
   - Candidatos

   [OPERACIONES]
   - Hakenshain
   - Ukeoi
   - Empresas

   [HERRAMIENTAS]
   - Documentos
   - OCR
   - Import/Export
   - Reportes

   [ADMIN]
   - Configuracion

3. Logo: Icono SVG custom con gradiente + texto
4. Badge de notificaciones en items del menu
5. Mobile: Drawer con overlay (no sidebar fijo)
```

### 4.3 Dashboard - Plano y sin datos visuales

**Problemas actuales:**
- Solo numeros en cards - sin graficas ni tendencias
- Colores hardcodeados (`text-blue-500`, `text-green-500`) fuera del sistema de theme
- Sin indicador de cambio (% semanal/mensual)
- Cards de segunda fila inconsistentes con la primera
- Panel de alertas sin paginacion (puede ser enorme)
- Sin grafico de tendencias
- No se ve "profesional", parece template basico

**Propuesta de rediseno:**
```
LAYOUT NUEVO:
ROW 1: 4 stat cards con:
  - Icono con fondo circular coloreado (no icono suelto)
  - Numero grande + label
  - Indicador de tendencia: flecha arriba/abajo + porcentaje
  - Mini sparkline chart (ultimos 7 dias)

ROW 2: Grid 2 columnas
  - Izquierda (2/3): Grafico de area/barras - candidatos y asignaciones por mes
  - Derecha (1/3): Donut chart - distribucion de estados

ROW 3: Grid 2 columnas
  - Izquierda: Alertas con tabs (Visa | Documentos | Teishokubi) max 5 items + "Ver todos"
  - Derecha: Actividad reciente con timeline vertical y avatares

COLORES: Usar CSS variables del theme, NO clases hardcodeadas
```

### 4.4 Tablas de datos - Sin experiencia moderna

**Problemas actuales:**
- Busqueda requiere click en boton "検索" (no es real-time)
- Sin header sticky (scroll pierde contexto)
- Sin seleccion multiple / acciones batch
- Paginacion basica ("前へ/次へ") sin saltar a pagina
- Thumbnails de foto 10x8px = demasiado pequenos
- Sin export directo desde la tabla
- Select de filtro es HTML nativo (feo)

**Propuesta de rediseno:**
```
TOOLBAR:
  - Busqueda instant (debounce 300ms, sin boton)
  - Filtros como pills/chips clickeables
  - Dropdown de columnas visibles
  - Boton export CSV/Excel
  - Counter: "24 resultados"

TABLA:
  - Header sticky con bg-background/95 backdrop-blur
  - Row hover con highlight suave
  - Checkbox de seleccion en primera columna
  - Avatar circular de 32x32px (no thumbnail rectangular)
  - Status badge con colores del theme
  - Acciones: dropdown menu (Ver | Editar | Eliminar)

PAGINACION:
  - Rango de paginas: [1] [2] [3] ... [12]
  - Selector de items por pagina (10/20/50)
  - "Mostrando 1-20 de 247 candidatos"
```

### 4.5 Formularios multi-step - Funcional pero mejorable

**Problemas actuales:**
- 9 pasos en linea horizontal = overflow en mobile
- Sin barra de progreso porcentual
- Sin auto-guardado (se pierde todo si cierras la pagina)
- Indicador de paso actual = color solido sin animacion
- Sin validacion en tiempo real (solo al submit)
- Labels con `*` pero sin leyenda de campos obligatorios

**Propuesta de rediseno:**
```
STEPPER:
  - Vertical en desktop (sidebar izquierda del form)
  - Horizontal en mobile con scroll horizontal
  - Cada paso: icono + titulo + subtitulo
  - Paso actual: anillo animado pulsante
  - Paso completado: checkmark verde con animacion
  - Barra de progreso: 0% -> 100% en top del form

FORM:
  - Auto-save con debounce (guardar draft en localStorage)
  - Validacion inline (green check / red X por campo)
  - Helper text debajo de campos complejos
  - Character counter en inputs de texto
  - Leyenda: "* campos obligatorios" al inicio
```

### 4.6 Esquema de colores - Sin identidad de marca

**Estado actual:** Tema Oklahoma/neutral de shadcn/ui - gris sobre gris con primary negro.

**Problemas:**
- Primary = negro (`oklch(0.205...)`) - sin color de marca
- Secondary = gris claro - identico a Accent
- Sin color de marca distinguible
- Dashboard usa colores hardcodeados fuera del theme
- Sin paleta semantica (success, warning, info)

**Propuesta de nuevo color scheme:**
```css
:root {
  /* Marca - Azul profesional japones (indigo/navy) */
  --primary: oklch(0.45 0.15 260);           /* Azul profundo */
  --primary-foreground: oklch(0.98 0.01 260);

  /* Secundario - Teal suave */
  --secondary: oklch(0.92 0.04 180);
  --secondary-foreground: oklch(0.25 0.06 180);

  /* Acento - Ambar dorado */
  --accent: oklch(0.85 0.12 85);
  --accent-foreground: oklch(0.25 0.04 85);

  /* Semanticos (NUEVOS) */
  --success: oklch(0.60 0.15 145);
  --success-foreground: oklch(0.98 0.01 145);
  --warning: oklch(0.75 0.15 85);
  --warning-foreground: oklch(0.25 0.05 85);
  --info: oklch(0.60 0.12 240);
  --info-foreground: oklch(0.98 0.01 240);

  /* Sidebar - Gradiente oscuro */
  --sidebar: oklch(0.20 0.03 260);
  --sidebar-foreground: oklch(0.90 0.01 260);
  --sidebar-primary: oklch(0.55 0.18 260);
}
```

---

## 5. ACCESIBILIDAD (Accessibility Audit Skill)

### 5.1 Hallazgos criticos

| # | Problema | WCAG | Impacto |
|---|---------|------|---------|
| A1 | Sin `lang="ja"` en `<html>` | 3.1.1 | Screen readers no saben pronunciar texto japones |
| A2 | Boton de ojo en tabla sin `aria-label` | 1.1.1 | Screen reader dice "button" sin contexto |
| A3 | Sin `aria-current="page"` en sidebar activa | 1.3.1 | Navegacion no comunica pagina actual |
| A4 | Notificacion bell sin `aria-label` | 1.1.1 | "button" sin contexto |
| A5 | Sin skip-to-content link | 2.4.1 | Usuarios de teclado deben tab por todo el sidebar |
| A6 | Status badges solo con color | 1.4.1 | Daltonianos no pueden distinguir estados |
| A7 | Select nativo sin label asociado en candidate-list | 1.3.1 | Filter sin label accesible |
| A8 | Sin focus management en navegacion de pasos del form | 2.4.3 | Focus no se mueve al cambiar paso |
| A9 | Imagenes en tabla sin alt descriptivo | 1.1.1 | `alt=""` en fotos de candidatos |
| A10 | Sin `role="alert"` en mensajes de error | 4.1.3 | Errores no se anuncian automaticamente |

### 5.2 Fixes rapidos (30 min cada uno)

```tsx
// A1: src/app/layout.tsx
<html lang="ja" suppressHydrationWarning>

// A2: candidate-list.tsx
<Button variant="ghost" size="sm" aria-label={`${name}の詳細を見る`}>

// A3: sidebar.tsx
<Link aria-current={isActive ? "page" : undefined} ...>

// A4: header.tsx
<Button variant="ghost" size="icon" aria-label="通知 3件の未読">

// A5: layout.tsx (dashboard)
<a href="#main-content" className="sr-only focus:not-sr-only ...">
  メインコンテンツへスキップ
</a>

// A10: login/page.tsx
{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
```

---

## 6. RENDIMIENTO

### 6.1 Problemas detectados

| # | Problema | Impacto |
|---|---------|---------|
| P1 | Base64 images en HTML (photoDataUrl) | Paginas pesadas, sin cache del browser |
| P2 | Sin `<Suspense>` boundaries | Todo o nada - pagina entera espera |
| P3 | CandidateList carga todos los datos de golpe | Lento con 1000+ registros |
| P4 | Sin memoizacion en componentes de lista | Re-renders innecesarios |
| P5 | Prisma queries sin `select` optimizado | Traen todos los campos |
| P6 | Sin ISR/revalidacion inteligente | Cada visita = query fresh |
| P7 | Noto Sans JP cargada sin `display: swap` | Flash of invisible text |

### 6.2 Optimizaciones recomendadas

```
P1: Migrar a next/image con archivos en /public o S3
P2: Envolver componentes async en <Suspense fallback={<Skeleton />}>
P3: Implementar cursor-based pagination en Prisma
P5: Usar Prisma select para traer solo campos necesarios:
    prisma.candidate.findMany({
      select: { id: true, lastNameKanji: true, ... }
    })
P7: Agregar font-display: swap en la config de Noto Sans JP
```

---

## 7. COMPONENTES UI FALTANTES

### Componentes que deberias agregar via shadcn/ui

```bash
# Criticos para la app
npx shadcn@latest add dialog          # Confirmaciones de eliminacion
npx shadcn@latest add dropdown-menu   # Acciones en tablas
npx shadcn@latest add tabs            # Navegacion en dashboard/settings
npx shadcn@latest add skeleton        # Loading states
npx shadcn@latest add avatar          # Fotos de candidatos
npx shadcn@latest add tooltip         # Iconos sin texto
npx shadcn@latest add alert           # Mensajes de sistema
npx shadcn@latest add progress        # Barra de progreso en forms
npx shadcn@latest add sheet           # Mobile sidebar drawer
npx shadcn@latest add separator       # Divisores en sidebar

# Opcionales pero recomendados
npx shadcn@latest add command         # Quick search (Cmd+K)
npx shadcn@latest add breadcrumb      # Navegacion contextual
npx shadcn@latest add pagination      # Paginacion estandar
npx shadcn@latest add popover         # Filtros avanzados
npx shadcn@latest add calendar        # Date pickers
```

---

## 8. ESTRUCTURA DE CODIGO - MEJORAS

### 8.1 Componentes compartidos que faltan

```
src/components/shared/
  page-header.tsx       -- Titulo + descripcion + acciones (boton nuevo)
  stat-card.tsx          -- Card de metrica reutilizable
  confirm-dialog.tsx     -- Dialog de confirmacion "Seguro que quieres..."
  search-toolbar.tsx     -- Barra busqueda + filtros reutilizable
  empty-state.tsx        -- Estado vacio con ilustracion
  loading-skeleton.tsx   -- Skeleton screens por tipo (table, card, form)
  mobile-nav.tsx         -- Drawer de navegacion mobile
```

### 8.2 Hooks custom que faltan

```
src/hooks/
  use-debounce.ts        -- Debounce para busqueda instant
  use-media-query.ts     -- Detectar mobile/tablet/desktop
  use-sidebar-state.ts   -- Estado colapsado del sidebar
  use-confirm.ts         -- Hook para dialog de confirmacion
```

### 8.3 Constantes y tokens que centralizar

```typescript
// src/lib/design-tokens.ts
export const LAYOUT = {
  SIDEBAR_WIDTH: 256,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  HEADER_HEIGHT: 64,
  MAIN_PADDING: 24,
} as const

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const
```

---

## 9. DOCKER / DEPLOYMENT

### 9.1 Problemas detectados

- `output: "standalone"` esta correcto
- Falta health check en Dockerfile
- Sin `.dockerignore` optimizado (verificar)
- Sin variable de entorno para URL base

### 9.2 Mejoras

```dockerfile
# Agregar health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

Crear endpoint: `src/app/api/health/route.ts`

---

## 10. PLAN DE ACCION PRIORIZADO

### FASE 1: Quick Wins (1-2 dias)

| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 1 | Agregar `lang="ja"` + aria-labels basicos | Alto | 30 min |
| 2 | Agregar security headers en next.config.ts | Alto | 30 min |
| 3 | Crear `error.tsx` y `loading.tsx` globales | Alto | 1 hora |
| 4 | Eliminar colores hardcodeados, usar CSS vars | Medio | 1 hora |
| 5 | Arreglar bell notification hardcodeada | Bajo | 30 min |
| 6 | Agregar `role="alert"` a mensajes de error | Medio | 30 min |

### FASE 2: UI/UX Overhaul (3-5 dias)

| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 7 | Instalar componentes shadcn faltantes (dialog, sheet, tabs...) | Alto | 2 horas |
| 8 | Nuevo color scheme con identidad de marca | Alto | 3 horas |
| 9 | Redisenar login page (split-screen + branding) | Alto | 4 horas |
| 10 | Sidebar colapsable + mobile drawer | Alto | 4 horas |
| 11 | Dashboard con graficas (Recharts ya instalado!) | Alto | 6 horas |
| 12 | Tablas con busqueda instant + header sticky + avatares | Alto | 4 horas |
| 13 | Form stepper vertical + progress bar + auto-save | Medio | 4 horas |

### FASE 3: Calidad y Seguridad (3-5 dias)

| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 14 | Configurar Vitest + tests para validators y utilidades | Critico | 4 horas |
| 15 | Rate limiting en login | Alto | 2 horas |
| 16 | Migrar fotos/docs de base64 a filesystem/S3 | Alto | 8 horas |
| 17 | Migrar company-form.tsx a react-hook-form | Medio | 2 horas |
| 18 | Optimizar Prisma queries con select | Medio | 3 horas |
| 19 | Agregar Suspense boundaries | Medio | 2 horas |
| 20 | Crear pagina /reports o eliminar del nav | Bajo | 2 horas |

### FASE 4: Polish y Produccion (2-3 dias)

| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 21 | Audit accesibilidad completo con screen reader | Alto | 4 horas |
| 22 | Tests e2e con Playwright (login, crear candidato, asignar) | Alto | 6 horas |
| 23 | Health check endpoint + Docker optimizado | Medio | 2 horas |
| 24 | Documentar design tokens y componentes | Bajo | 3 horas |

---

## 11. RESUMEN EJECUTIVO

### Lo que esta BIEN:
- Stack moderno y actualizado (Next.js 16, React 19, Prisma 6, Zod 4, TW4)
- Arquitectura Server Actions bien organizada por dominio
- RBAC robusto con 8 niveles de rol
- Audit logging en todas las mutaciones
- Manejo correcto de datos japoneses (3 sistemas de nombre, wareki, prefecturas)
- OCR multi-proveedor con circuit breaker
- Docker ready con standalone output

### Lo que esta MAL:
- **UI/UX generico** - Parece template de shadcn/ui sin customizar (tu queja principal)
- **Sin tests** - 0% cobertura en una app de compliance
- **Sin identity visual** - Logo es una letra "S", colores son grises, sin marca
- **Archivos en base64 en DB** - No escalable, slow queries
- **Sin error/loading states** - UX se siente "roto" al navegar
- **Accesibilidad basica ausente** - Sin lang, sin aria, sin skip-nav
- **Dashboard sin graficas** - Recharts esta instalado pero no se usa
- **Security headers ausentes** - XSS/clickjacking posibles

### Conclusion:
La arquitectura backend y la logica de negocio son solidas. El problema principal es la capa de presentacion: **el UI se ve como un prototipo funcional, no como un producto terminado**. Las mejoras en Fase 1 y 2 transformarian la experiencia del usuario significativamente. La Fase 3 es critica para produccion (tests + seguridad).

**Estimacion total de mejoras: ~10-15 dias de trabajo enfocado.**
