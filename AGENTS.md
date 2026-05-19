---
description: Khanza Hospital Information System (SIMRS) API - Node.js/Express Healthcare Backend
---

# Khanza-API: Hospital Management System

## Project Overview

**Khanza** is a comprehensive **Hospital Information System (SIMRS) API** built with Node.js/Express that manages all aspects of hospital operations. The system handles patient registration, outpatient/inpatient care, medical records, billing, insurance claims, and clinical documentation in compliance with Indonesian healthcare standards (BPJS, InaCBG).

**Stack**: Node.js 20 + Express.js + Sequelize ORM + MariaDB + Redis + JWT + PM2  
**Version**: 1.4.8  
**Author**: Fakhry  
**License**: ISC  

---

## Architecture at a Glance

```
┌─────────────────────────────────────────┐
│         Express REST API (port 3000)     │
│  (/api/ranap, /api/ralan, /api/icd ...) │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────────┬───────────────┐
       │                    │               │
   ┌───▼──┐            ┌───▼──┐       ┌───▼────┐
   │Routes│            │ Auth │       │ Cache  │
   │  (9) │            │ (JWT)│       │(Redis) │
   └───┬──┘            └──────┘       └────────┘
       │
   ┌───▼────────────────┐
   │  Controllers (11)  │  ◄── Business Logic
   └───┬────────────────┘
       │
   ┌───▼────────────────────────┐
   │  Models (45+ Sequelize)    │  ◄── ORM Entities
   │  + Associations            │
   └───┬────────────────────────┘
       │
   ┌───▼──────────────┐
   │   MariaDB        │
   │  (Hospital Data) │
   └──────────────────┘
```

---

## Domain Model (Hospital Entities)

The API organizes data around **9 hospital domains**:

### 1. **Patient Management** (`/api/registrasi`, `/api/ralan`)
- `pasien` - Patient master records
- `reg_periksa` - Medical visit registrations
- `booking_periksa`, `booking_registrasi` - Appointment booking
- `pengumuman_epasien` - E-patient announcements

### 2. **Outpatient Care** (`/api/ralan`)
- `pemeriksaan_ralan` - Outpatient examination records
- `jns_perawatan` - Treatment types
- `diagnosa_pasien` - Diagnosis linked to patients

### 3. **Inpatient Care** (`/api/ranap`)
- `kamar_inap` - Inpatient rooms
- `dpjp_ranap` - Attending physician assignments
- `pemeriksaan_ranap` - Inpatient examinations
- `booking_operasi` - Operating room booking

### 4. **Facilities & Staff** (`/api/petugas`)
- `bangsal` - Wards/Departments
- `poliklinik` - Clinics
- `kamar` - Room masters
- `pegawai` - Employees
- `petugas` - Staff assignments
- `dokter` - Physicians
- `spesialis` - Medical specialists
- `jadwal` - Doctor schedules

### 5. **Billing & Insurance** (`/api/ranap`, internal)
- `penjab` - Insurance providers (Umum, BPJS, etc.)
- `billing` - Billing transactions
- `bridging_sep` - BPJS SEP bridging
- `bridging_surat_kontrol_bpjs` - BPJS control letters

### 6. **Clinical Documentation**
- `berkas_digital_perawatan` - Digital care files
- `master_berkas_digital` - Digital file templates
- `surat_pernyataan_pasien_umum*` - Patient statements
- `surat_persetujuan_*` - Medical consent forms

### 7. **Medical Coding** (`/api/icd`)
- `icd10`, `icd9` - International disease classifications
- `penyakit` - Disease master
- `kategori_penyakit` - Disease categories

### 8. **Supportive Services** (`/api/penunjang`)
- `jns_perawatan_lab` - Laboratory test types
- `jns_perawatan_radiologi` - Radiology procedure types
- `template_laboratorium` - Lab result templates

### 9. **Dashboard & Analytics** (`/api/dashboard`)
- Aggregated views for hospital metrics
- Performance indicators

---

## API Endpoint Structure

### URI Pattern
```
/api/{module}/{resource}
```

**No version numbering** in URLs. Breaking changes managed through backward compatibility or parallel endpoints.

### Modules & Key Routes

| Module | Endpoints | Purpose |
|--------|-----------|---------|
| `/api/ranap` | `belumpulang`, `listberkas`, `ruangan` | Inpatient management |
| `/api/ralan` | `daftarperiksa`, `poli`, `kasir` | Outpatient management |
| `/api/registrasi` | `bookingperiksa`, `bookingdokter` | Patient registration |
| `/api/icd` | ICD search & validation | Medical coding |
| `/api/petugas` | Staff CRUD, schedules | Workforce management |
| `/api/penunjang` | Lab/imaging procedures | Ancillary services |
| `/api/dashboard` | Metrics, reports | Hospital analytics |
| `/api/views` | Read-only queries | Reporting views |
| `/api/inacbg` | InaCBG claims | Insurance bridging |

### Response Format (Unified)
```javascript
{
  status: true | false,              // Success indicator
  message: "String description",      // Human-readable status
  data: { /* payload */ },           // Main response body
  record?: number,                   // Count of records (optional)
  queryParam?: { /* echo */ }        // Original query params (optional)
}
```

---

## Authentication & Authorization

### JWT-Based Auth
- **Tokens**: Bearer token in `Authorization` header
- **Payload**: Contains `kd_access[]` array with role identifiers
- **Secret**: `JWT_SECRET_KEY` from environment
- **Middleware**: All protected routes use `middleware.check`

### Role Levels (lvid)
| Level | Role | Usage |
|-------|------|-------|
| `1` | Admin | Full system access |
| `3` | Doctor (Dokter) | Medical records, prescriptions |
| Other | Staff | Department-specific access |

### Middleware Application
```javascript
app.get('/api/ranap/sensitive-data', middleware.check, controllerFunction);
// Token validated via middleware.check before reaching controller
```

---

## Key Conventions & Patterns

### 1. **Database: Sequelize ORM**
- **Auto-loading**: Models in `/models` directory auto-discover and associate
- **Associations**: One-to-Many, Many-to-Many pre-configured
- **Queries**: Heavy use of Sequelize operators (`Op.between`, `Op.like`, `Op.in`)
- **Include patterns**: Nested associations for rich data fetches
- **Example**:
  ```javascript
  // models/pasien.js
  Pasien.hasMany(RegPeriksa, { foreignKey: 'no_rkm_medis' });
  RegPeriksa.belongsTo(Pasien, { foreignKey: 'no_rkm_medis' });
  ```

### 2. **Controllers: Direct Data Access**
- Business logic embedded directly in controllers
- One controller per domain (e.g., `ralan.js`, `ranap.js`)
- No dedicated service layer
- Pattern:
  ```javascript
  exports.getNamaFungsi = async (req, res) => {
    try {
      const data = await Model.findAll({ /* query */ });
      return res.json({ status: true, message: 'OK', data });
    } catch (e) {
      return res.status(500).json({ status: false, message: e.message });
    }
  };
  ```

### 3. **Encryption Patterns (Mixed)**
- **JWT**: Authentication tokens
- **MySQL AES-256-CBC**: Password storage in database (via `user.js` helper)
- **Custom AES**: E-Klaim/InaCBG API payloads signed for external integrations (via `encryption.js` helper)
- **No bcrypt**: Raw MySQL encryption used for legacy compatibility

### 4. **Caching with Redis**
- Redis client connected at startup
- Attached to every request: `req.cache`
- Developers manually implement cache logic in controllers
- Pattern:
  ```javascript
  const cached = await req.cache.get('key');
  if (cached) return res.json(JSON.parse(cached));
  // Fetch from DB, cache result
  ```

### 5. **Error Handling**
- **No global error handler middleware** - each controller has try-catch
- **Console logging** - errors logged to stdout
- **No structured logging** - consider adding Winston/Pino for production
- **Status codes**: 200 (success), 400 (validation), 401 (auth), 404 (not found), 500 (server error)

### 6. **Helpers Provide Domain Logic**
| Helper | Domain |
|--------|--------|
| `encryption.js` | Encryption for external APIs (InaCBG, e-Klaim) |
| `user.js` | Password operations, user queries |
| `beds.js` | Bed occupancy calculations, date-range logic |
| `api.js` | External integrations (LPKP docs, claims) |
| `kalkulator.js` | Domain-specific calculations (rates, metrics) |
| `index.js` | Utilities like `getCurrentTime()` |

### 7. **Cache Folder Structure**
- `/cache/bangsal/` - Ward cache
- `/cache/dpjp/` - Attending physician cache
- Used for static/frequently-accessed data

---

## Development Setup

### Prerequisites
- **Node.js**: 20.x (Alpine-based in Docker)
- **MariaDB**: 10.x (or compatible MySQL)
- **Redis**: 4.x+
- **PM2**: Process manager (installed via npm)

### Environment Variables (Required)
```env
NODE_ENV=development|production
PORT=3000

# Database
DB_USERNAME=root
DB_PASSWORD=secret
DB_NAME=simrs_khanza
DB_HOST=localhost
DB_DIALECT=mariadb

# Security
JWT_SECRET_KEY=your-secret-key
JWT_SECRET_KEY_LPKP=your-lpkp-secret

# Redis
REDIS_URL=localhost
REDIS_URL_PORT=6379
REDIS_PASSWORD=redis-pass

# External APIs
URL_BPJS=https://bpjs.gov.id/api
HOST_API_LPKP=https://lpkp-api.gov.id
INACBG_UrlWS=https://inacbg.gov.id/ws
INACBG_keyRS=your-hospital-key
```

### Running Locally
```bash
# Install dependencies
npm install

# Setup database (Sequelize migrations)
npx sequelize-cli db:migrate

# Development mode
node index.js
# or with auto-restart (install nodemon first)
npx nodemon index.js

# Production with PM2
pm2 start ecosystem.config.js
```

### Docker Deployment
```bash
# Build image
docker build -t khanza-api:latest .

# Run with docker-compose
docker-compose up
```

**Docker Setup** ([Dockerfile](Dockerfile)):
- Base: `node:20-alpine`
- Port: `3000`
- Process Manager: PM2
- Volumes: Shared document storage (configured in `docker-compose.yml`)

---

## Common Development Tasks

### Adding a New API Endpoint
1. Create or extend a model in `models/` (if needed)
2. Add controller method in `controllers/{domain}.js`
3. Register route in `routes/{domain}.js`:
   ```javascript
   router.get('/endpoint-name', middleware.check, Controller.methodName);
   ```
4. Return unified response format (see Response Format above)

### Adding a New Database Model
1. Create file in `models/` following Sequelize conventions
2. Import in `models/index.js` (auto-discovery handles associations)
3. Run `npx sequelize-cli db:migrate` to apply schema changes

### Integrating with External API (BPJS, InaCBG)
1. Add integration in `helpers/api.js` or new helper file
2. Use `encryption.js` for payload signing/verification
3. Store credentials in environment variables
4. Add error handling for timeout/validation failures

### Adding Authentication to an Endpoint
```javascript
// In routes/{domain}.js
router.get('/protected-route', middleware.check, Controller.method);
// middleware.check validates JWT in Authorization header
```

### Implementing Caching
```javascript
// In controller
const cacheKey = `entity-${id}`;
let data = await req.cache.get(cacheKey);
if (!data) {
  data = await Model.findByPk(id);
  await req.cache.setEx(cacheKey, 3600, JSON.stringify(data)); // 1 hour TTL
}
```

---

## Important Files & Entry Points

| File | Purpose |
|------|---------|
| [index.js](index.js) | Server startup, middleware setup, route registration |
| [package.json](package.json) | Dependencies, scripts, project metadata |
| [config/config.js](config/config.js) | Database connection config (Sequelize) |
| [Dockerfile](Dockerfile) | Container image definition |
| [ecosystem.config.js](ecosystem.config.js) | PM2 process configuration |
| [models/index.js](models/index.js) | ORM initialization, auto-association |
| [middleware/index.js](middleware/index.js) | Auth & cross-cutting concerns |
| [helpers/encryption.js](helpers/encryption.js) | Encryption/decryption for external APIs |
| [.env](env) | Environment variable template |

---

## External Integrations

### BPJS (Indonesian Social Security Insurance)
- **Purpose**: Insurance claim submission and validation
- **Models**: `bridging_sep`, `bridging_surat_kontrol_bpjs`
- **Helper**: See `api.js` and `encryption.js`
- **Env Vars**: `URL_BPJS`, `JWT_SECRET_KEY_LPKP`

### InaCBG (Indonesian Case-Based Grouping)
- **Purpose**: Hospital claims grouping by diagnosis & procedure
- **Models**: `maping_poli_bpjs`, `referensi_mobilejkn_bpjs*`
- **Helper**: `encryption.js` (API payload signing)
- **Env Vars**: `INACBG_UrlWS`, `INACBG_keyRS`

### ICD-10/ICD-9 Coding
- **Purpose**: Medical diagnosis/procedure standardization
- **Models**: `icd10`, `icd9`, `penyakit`
- **Routes**: `/api/icd`

---

## Best Practices for This Codebase

1. **Always use try-catch in controllers** and return proper HTTP status codes
2. **Validate JWT before accessing sensitive data** - use `middleware.check`
3. **Cache frequently-accessed data** via `req.cache` with appropriate TTLs
4. **Follow the unified response format** - consistency is key for frontend integration
5. **Use Sequelize operators** (`Op.*`) for complex queries, not raw SQL
6. **Store secrets in environment variables**, never hardcode
7. **Log important operations** (auth failures, API calls) to console (plan to upgrade to structured logging)
8. **Test encryption/decryption** with BPJS/InaCBG before production deployment
9. **Document domain-specific logic** - healthcare business rules can be subtle
10. **Run migrations** before deploying schema changes

---

## Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| `Redis connection refused` | Redis service not running | Start Redis: `redis-server` |
| `Database connection failed` | Wrong credentials or host | Check `.env` and MariaDB running |
| `JWT validation failed` | Expired/invalid token | Request new token from `/api/auth` or equivalent |
| `Encryption error in InaCBG calls` | Wrong signature key | Verify `INACBG_keyRS` in `.env` |
| `Port 3000 already in use` | Another process on port | Change `PORT` env var or kill existing process |
| `Models not auto-loading` | Sequelize cache issue | Clear `node_modules/.cache` and restart |

---

## Suggested Next Steps for AI Agents

When working with this codebase:
1. **Before adding features**: Check if domain model already exists in `/models`
2. **For bug fixes**: Verify JWT tokens are valid and Redis is connected
3. **For API additions**: Mirror existing controller patterns for consistency
4. **For external API work**: Review helpers to understand encryption requirements
5. **For deployment**: Test environment variables match `Dockerfile` expectations

---

## Questions or Customizations?

This document serves as a knowledge base for AI agents. Update it as:
- New integrations are added
- Architecture changes occur
- New conventions are established
- Troubleshooting patterns emerge
