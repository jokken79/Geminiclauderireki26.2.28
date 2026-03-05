# Pasos de Importacion - Base de Datos Antigua (Access) a Staffing OS (PostgreSQL)

Fecha: 2026-03-05

## Resumen

Migracion completa de **1,220 candidatos** con fotos desde Microsoft Access (.accdb) hacia PostgreSQL via Prisma ORM.

| Metrica | Resultado |
|---------|-----------|
| Candidatos importados | 1,220 / 1,220 (100%) |
| Con foto | 1,189 / 1,220 (97.5%) |
| Work History | 2,454 registros |
| Family Members | 871 registros |
| Errores finales | 0 |

---

## Origen y Destino

### Origen: Microsoft Access
- **Archivo**: `C:\Users\kenji\OneDrive\Desktop\ユニバーサル企画㈱データベースv25.3.24.accdb` (11MB)
- **Tabla principal**: `T_履歴書` (170 columnas, 1,220 registros)
- **Otras tablas**: `DBGenzaiX` (1,072), `DBStaffX` (23), `DBUkeoiX` (141)
- **Fotos**: Access Attachment type (sub-tabla con `[写真].[FileName]` y `[写真].[FileData]`)
- **Herramienta de referencia**: `D:/Git/RirekishoDBaseAntigua/` (app Python/Tkinter)

### Destino: Staffing OS (PostgreSQL)
- **Proyecto**: `D:/Git/Geminiclauderireki26.2.28/staffing-os/`
- **Stack**: Next.js 16 + Prisma 6 + PostgreSQL 16
- **Modelo principal**: `Candidate` (~80 campos) + relaciones `WorkHistory`, `FamilyMember`
- **Fotos**: base64 data URL en campo `photoDataUrl` (tipo `@db.Text`)
- **Docker**: `staffing-os-db-1` (PostgreSQL 16 Alpine)

---

## Paso 1: Analisis de ambas bases de datos

### 1.1 Inspeccion de Access DB
```bash
pip install pyodbc Pillow
```

Se descubrio que:
- El campo `写真` NO es OLE binario, es tipo **Access Attachment**
- Se accede con sintaxis de sub-tabla: `SELECT [写真].[FileName], [写真].[FileData] FROM [T_履歴書]`
- `FileData` tiene un header de **20 bytes** antes de los datos JPEG reales
- La firma JPEG (`FF D8 FF`) se encuentra en el offset 20

### 1.2 Inspeccion de PostgreSQL
```bash
docker exec staffing-os-db-1 psql -U staffing -d staffing_os -c 'SELECT COUNT(*) FROM "Candidate";'
# Resultado: 0 (base de datos vacia)
```

---

## Paso 2: Exportacion de Access a JSON + Fotos

### Script: `prisma/export-access.py`

Conecta a Access via pyodbc, extrae todos los datos y fotos.

```bash
cd D:/Git/Geminiclauderireki26.2.28/staffing-os
python prisma/export-access.py
```

**Proceso:**
1. Conecta a `.accdb` via ODBC driver
2. Lee fotos con query de sub-tabla Attachment (`[写真].[FileData]`)
3. Extrae imagen JPEG buscando firma `FF D8 FF` despues del header de 20 bytes
4. Convierte cada foto a base64 data URL (`data:image/jpeg;base64,...`)
5. Mapea 170 columnas japonesas a campos del modelo Prisma `Candidate`
6. Exporta `candidates.json` (383MB) + fotos JPG de backup

**Resultado:**
```
Candidates: 1220
Photos OK: 1201
Photos missing: 19
Output: prisma/legacy-import/candidates.json
Photos: prisma/legacy-import/photos/
```

### Mapeo de campos principales

| Access (T_履歴書) | Prisma (Candidate) | Transformacion |
|---|---|---|
| 氏名 (romaji) | lastNameRomaji + firstNameRomaji | Split por espacio |
| フリガナ | lastNameFurigana + firstNameFurigana | Split + fullwidth kana |
| 性別 ("男"/"女") | gender (MALE/FEMALE) | Mapeo directo |
| 写真 (Attachment) | photoDataUrl | OLE header skip + base64 |
| 在留資格 (texto) | visaStatus (ENUM) | Mapeo texto a 18 enums |
| 国籍 (half-width kana) | nationality | Conversion a fullwidth |
| 現住所 | prefecture + city | Extraccion de prefectura |
| 郵便番号 | postalCode | Formato XXX-XXXX |
| 家族構成1-5 | FamilyMember[] | 5 slots a registros |
| 職歴1-7 | WorkHistory[] | 7 slots a registros, deteccion 派遣元/派遣先 |
| 身長/体重/靴 | height/weight/shoeSize (Float) | Limpieza "cm"/"kg" |
| お弁当 (4 bools) | bentoPreference | Logica combinada |

---

## Paso 3: Importacion a PostgreSQL

### Script: `prisma/import-legacy.ts`

Lee el JSON exportado e inserta candidatos via Prisma Client.

```bash
cd D:/Git/Geminiclauderireki26.2.28/staffing-os
npx tsx prisma/import-legacy.ts
```

### Problemas encontrados y soluciones

#### 3.1 Campo `写真` retornaba string (nombre de archivo), no bytes
- **Causa**: Access Attachment type devuelve filename por defecto via ODBC
- **Solucion**: Usar query de sub-tabla `[写真].[FileName], [写真].[FileData]`

#### 3.2 `firstNameKanji` requerido
- **Causa**: Schema Prisma define `firstNameKanji String @db.VarChar(50)` sin `?`
- **Solucion**: Valor por defecto `''` cuando es null

#### 3.3 `height`, `weight`, `shoeSize` son Float, no String
- **Causa**: JSON exportaba "168" (string), Prisma espera Float
- **Solucion**: Funcion `toFloat()` para parsear numeros

#### 3.4 `receptionDate` y `licenseExpiry` son DateTime, no String
- **Causa**: Pasabamos string "2025-07-08" en vez de Date object
- **Solucion**: Funcion `toDate()` para convertir strings ISO a Date

#### 3.5 `age` en FamilyMember es Int, no String
- **Causa**: JSON exportaba "34" (string), Prisma espera Int
- **Solucion**: `parseInt(String(fm.age), 10)`

#### 3.6 `lastNameFurigana` y `firstNameFurigana` son requeridos
- **Causa**: Schema sin `?`, pero algunos candidatos no tenian furigana
- **Solucion**: Fallback al nombre kanji si furigana esta vacio

#### 3.7 `startYear` y `startMonth` en WorkHistory son requeridos
- **Causa**: Algunos registros de Access tenian historial laboral sin fechas
- **Solucion**: Filtrar entries sin startYear/startMonth antes de insertar

#### 3.8 Valores exceden VarChar limits (92 registros fallaban)
- **Causa**: Access Text fields son ilimitados, PostgreSQL VarChar es estricto
- **Solucion**: Funcion `trunc(val, maxLen)` aplicada a todos los campos VarChar
- Limites aplicados: VarChar(3), VarChar(5), VarChar(8), VarChar(10), VarChar(15), VarChar(20), VarChar(30), VarChar(50), VarChar(100), VarChar(200)

#### 3.9 `commuteTimeMin` es String en schema, no Int
- **Causa**: Schema define `@db.VarChar(10)` pero JSON exportaba number
- **Solucion**: `String(c.commuteTimeMin).slice(0, 10)`

---

## Paso 4: Importacion de fotos (segundo paso)

### Script: `prisma/import-photos.ts`

Se importaron fotos en paso separado para evitar mensajes de error enormes (base64 llenaba los error messages de Prisma).

```bash
npx tsx prisma/import-photos.ts
```

**Matching**: Por nombre (lastNameKanji + firstNameKanji) + fecha de nacimiento (birthDate)

**Resultado:**
```
Updated: 1198
Skipped (no photo/already has): 19
Not found in DB: 3
```

---

## Archivos creados

```
staffing-os/prisma/
├── export-access.py          # Python: Access -> JSON + fotos
├── import-legacy.ts          # TypeScript: JSON -> PostgreSQL (datos)
├── import-photos.ts          # TypeScript: Fotos -> PostgreSQL (base64)
├── pasosdeimportacion.md     # Este documento
└── legacy-import/
    ├── candidates.json       # 383MB - datos exportados con fotos base64
    ├── photos/               # 1,201 archivos JPG (backup)
    └── import-errors.json    # Log de errores (vacio en run final)
```

---

## Como re-ejecutar la migracion

### Prerrequisitos
- Python 3.8+ con `pyodbc`, `Pillow`
- Node.js 20+ con dependencias de staffing-os instaladas
- PostgreSQL corriendo (Docker: `docker compose up -d`)
- Microsoft Access ODBC Driver instalado en Windows

### Ejecucion completa
```bash
cd D:/Git/Geminiclauderireki26.2.28/staffing-os

# 1. Exportar desde Access (genera JSON + fotos)
python prisma/export-access.py

# 2. Limpiar base de datos (DESTRUCTIVO)
docker exec staffing-os-db-1 psql -U staffing -d staffing_os -c '
  DELETE FROM "WorkHistory";
  DELETE FROM "FamilyMember";
  DELETE FROM "Candidate";
'

# 3. Importar datos (sin fotos)
npx tsx prisma/import-legacy.ts

# 4. Importar fotos
npx tsx prisma/import-photos.ts
```

### Verificacion
```bash
docker exec staffing-os-db-1 psql -U staffing -d staffing_os -c "
  SELECT 'Candidates' as entity, COUNT(*) FROM \"Candidate\"
  UNION ALL SELECT 'With Photo', COUNT(*) FROM \"Candidate\" WHERE \"photoDataUrl\" IS NOT NULL
  UNION ALL SELECT 'Work History', COUNT(*) FROM \"WorkHistory\"
  UNION ALL SELECT 'Family Members', COUNT(*) FROM \"FamilyMember\";
"
```

Resultado esperado:
```
 Candidates     | 1220
 With Photo     | 1189
 Work History   | 2454
 Family Members |  871
```

---

## Datos no migrados (pendiente)

Las siguientes tablas de Access NO fueron migradas en esta iteracion:

| Tabla Access | Registros | Destino en Staffing OS |
|---|---|---|
| `DBGenzaiX` | 1,072 | `HakenshainAssignment` (派遣社員) |
| `DBStaffX` | 23 | `User` o tabla interna |
| `DBUkeoiX` | 141 | `UkeoiAssignment` (請負) |

Para migrar estas tablas se necesitaria crear scripts adicionales con mapeo de campos especifico y vinculacion con los candidatos ya importados.
