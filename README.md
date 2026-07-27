# ms-core - Microservicio de Dominio (Core Business Logic)

**Servicio:** ms-core  
**Puerto:** 3001 (configurable via `PORT`)  
**Version:** 0.0.1  
**Ultima actualizacion:** 2026-07-26

---

## Proposito

Microservicio central que contiene toda la logica de negocio del ERP SEIS_App. Gestiona el dominio principal: facturas, usuarios, organizaciones, ofertas, marketplace, catálogos y permisos granulares.

---

## Arquitectura

```
BFF (3002) → ms-core (3001)
                 ↓
        PostgreSQL + Redis + MinIO
                 ↑
     Worker Storage Processor (OCR)
```

### Responsabilidades

- ✅ CRUD Facturas (lifecycle completo)
- ✅ Marketplace de facturas (ofertas, matching)
- ✅ Gestion de organizaciones (empresas cedentes y financiadoras)
- ✅ Perfiles de usuario y permisos granulares
- ✅ Catálogos (geo, bancos, productos financieros)
- ✅ Solicitudes de acceso a organizaciones
- ✅ Webhooks de storage (OCR completado)
- ✅ Integracion con MinIO para storage de documentos

---

## Stack Tecnologico

- **Framework:** NestJS 10 + TypeScript
- **Base de datos:** PostgreSQL (schemas: `factura`, `core`, `media`)
- **Cache:** Redis (facturas marketplace, permisos)
- **Storage:** MinIO (via ms-storage-orchestrator)
- **Queue:** RabbitMQ (recibe notificaciones de OCR)
- **Secrets:** Vault (DB, Redis, MinIO credentials)

---

## Controllers (10 Endpoints Groups)

### 1. Health Check (`/health`)
**Controller:** `healthcheck.controller.ts`  
**Auth:** Publica

- `GET /health` - Estado del servicio

---

### 2. Factura Manager (`/factura`)
**Controller:** `factura-manager.controller.ts`  
**Permisos:** `FCT_VEW`, `FCT_CREATE`, `FCT_EDIT`, `FCT_DELETE`, `READ_ONLY`

#### Endpoints

**Obtener URLs de facturas**
- `POST /factura/url`
  - Body: `{ userUUID, organizacionUUID, facturas: string[] }`
  - Genera presigned URLs de MinIO para visualizar PDFs
  - Response: Array de URLs firmadas

**Listar facturas**
- `GET /factura/list/:organizacionUUID/:filtro`
  - Filtros: `todas`, `pendientes`, `aprobadas`, `rechazadas`, `publicadas`
  - Response: Array de facturas con metadata

**Crear factura**
- `POST /factura`
  - Body: `FacturaCreateRequestDto`
  - Validacion de permisos: `FCT_CREATE`
  - Response: Factura creada con UUID

**Actualizar factura**
- `PATCH /factura/:id`
  - Body: `FacturaUpdateModel` (campos editados)
  - Validacion: `FCT_EDIT`
  - Auditoria de cambios en `CampoEditado[]`

**Autorizar publicacion**
- `POST /factura/:id/autorizacion`
  - Cambia estado a `PUBLICADA`
  - Notifica a marketplace via Redis pub/sub

---

### 3. Catalogo (`/catalogo`)
**Controller:** `catalogo.controller.ts`  
**Auth:** Protegido

**Geo (Chile)**
- `GET /catalogo/geo/regiones`
- `GET /catalogo/geo/provincias?regionId=X`
- `GET /catalogo/geo/comunas?provinciaId=X`

**Financiero**
- `GET /catalogo/bancos` - Bancos de Chile
- `GET /catalogo/productos-financieros` - Tipos de factoring

**Media**
- `GET /catalogo/media-category` - Categorias de archivos (legal, contable, tributario)

---

### 4. Portal Core (`/portal`)
**Controller:** `core-portal.controller.ts`

Endpoints de inicializacion del portal, datos de sesion usuario, configuracion inicial.

---

### 5. Organizacion (`/organizacion`)
**Controller:** `organizacion.controller.ts`  
**Permisos:** `ORG_VIEW`, `ORG_EDIT`, `ORG_ADMIN`

**CRUD Organizaciones**
- `GET /organizacion/:id` - Datos de organizacion
- `POST /organizacion` - Crear organizacion (cedente o financiadora)
- `PATCH /organizacion/:id` - Actualizar datos
- `GET /organizacion/:id/miembros` - Lista miembros
- `POST /organizacion/:id/miembros` - Agregar miembro
- `DELETE /organizacion/:id/miembros/:uuid` - Remover miembro

---

### 6. Organizacion Admin (`/organizacion-admin`)
**Controller:** `organizacion-admin.controller.ts`  
**Permisos:** `ADMIN_CEDENTE`, `ADMIN_FINANCIADORA`, `SUPER_ADMIN`

Gestion avanzada: grupos de trabajo, permisos granulares, estructura organizacional.

---

### 7. User Profile (`/user-profile`)
**Controller:** `user-profile.controller.ts`  
**Permisos:** Usuario autenticado

**Gestion de Perfil**
- `GET /user-profile/:uuid` - Datos del usuario
- `PATCH /user-profile/:uuid` - Actualizar perfil
- `POST /user-profile/:uuid/avatar` - Subir avatar (proxy a MinIO)

**Permisos del usuario**
- `GET /user-profile/:uuid/permisos` - Permisos efectivos por organizacion

---

### 8. Solicitudes Acceso (`/solicitud-acceso`)
**Controller:** `solicitudAcceso.controller.ts`

**Workflow:**
1. Usuario solicita acceso a organizacion
2. Admin de organizacion aprueba/rechaza
3. Si aprobado, se crea relacion usuario-organizacion con rol

**Endpoints:**
- `POST /solicitud-acceso` - Crear solicitud
- `GET /solicitud-acceso/org/:orgId` - Listar solicitudes pendientes
- `PATCH /solicitud-acceso/:id/aprobar` - Aprobar solicitud
- `PATCH /solicitud-acceso/:id/rechazar` - Rechazar solicitud

---

### 9. Storage (`/storage`)
**Controller:** `storage.controller.ts`

**Proxy a MinIO via ms-storage-orchestrator:**
- `GET /storage/presigned-url` - Generar URL firmada para upload
- `GET /storage/download/:key` - Descargar archivo
- `POST /storage/upload` - Upload directo (small files)

---

### 10. Webhook (`/webhook`)
**Controller:** `webhook.controller.ts`  
**Auth:** Internal (solo desde ms-storage-orchestrator)

**Notificaciones de procesamiento:**
- `POST /webhook/ocr-completed`
  - Body: `{ facturaId, ocrData, status }`
  - Actualiza factura con datos extraidos por OCR
  - Notifica a usuario via WebSocket

---

## Use Cases (Casos de Uso)

### FacturaManagerUseCase (IFacturaManager)

**Comandos:**
- `ExecuteGetUrlFacturas(facturas[], correlationId)` - Presigned URLs
- `ExecuteGetFacturas(userUuid, orgUuid, filtro)` - Listar facturas
- `ExecuteCreateFactura(dto, userUuid)` - Crear factura
- `ExecuteUpdateFactura(id, model, userUuid)` - Actualizar
- `ExecuteAuthorizePublicacion(id, userUuid)` - Publicar en marketplace

---

### OrganizacionUseCase (IOrganizacionAdministrator)

**Comandos:**
- `ExecuteCreateOrganizacion(dto)` - Crear organizacion
- `ExecuteGetOrganizacion(id)` - Obtener datos
- `ExecuteUpdateOrganizacion(id, dto)` - Actualizar
- `ExecuteAddMiembro(orgId, userId, rol)` - Agregar miembro
- `ExecuteRemoveMiembro(orgId, userId)` - Remover miembro

---

### UserProfileAdministratorUseCase (IUserProfileAdministratorUseCase)

**Comandos:**
- `ExecuteGetProfile(uuid)` - Datos de usuario
- `ExecuteUpdateProfile(uuid, dto)` - Actualizar perfil
- `ExecuteGetPermisos(uuid, orgId)` - Permisos efectivos

---

### AccesoOrganizacionUseCase (ISolicitudeAcceso)

**Comandos:**
- `ExecuteCreateSolicitud(dto)` - Crear solicitud
- `ExecuteGetSolicitudes(orgId)` - Listar solicitudes
- `ExecuteAprobarSolicitud(id, adminId)` - Aprobar
- `ExecuteRechazarSolicitud(id, adminId, motivo)` - Rechazar

---

## Permisos Granulares

### Sistema de Permisos

**Modelo:** Usuario → Rol → Permisos (RBAC + ABAC)

### Permisos Facturas

| Codigo | Descripcion |
|--------|-------------|
| `FCT_VEW` | Ver facturas |
| `FCT_CREATE` | Crear facturas |
| `FCT_EDIT` | Editar facturas |
| `FCT_DELETE` | Eliminar facturas |
| `FCT_PUBLISH` | Publicar en marketplace |
| `READ_ONLY` | Solo lectura |

### Permisos Organizacion

| Codigo | Descripcion |
|--------|-------------|
| `ORG_VIEW` | Ver organizacion |
| `ORG_EDIT` | Editar organizacion |
| `ORG_ADMIN` | Administrar miembros |
| `ORG_DELETE` | Eliminar organizacion |

### Decoradores

- `@Permissions(...codes)` - Valida permisos antes de ejecutar endpoint
- `@Public()` - Endpoint sin permisos (solo healthcheck)

---

## Schemas PostgreSQL

### Schema `factura`

**Tablas principales:**
- `factura` - Documento de factura (monto, vencimiento, deudor, estado)
- `ofertas` - Propuestas de financiamiento de ejecutivas
- `historial_negocios` - Operaciones cerradas, calificaciones

**Estados de factura:**
- `DRAFT` - Borrador
- `PENDIENTE_VALIDACION` - En revision
- `VALIDADA` - Aprobada internamente
- `PUBLICADA` - Disponible en marketplace
- `EN_NEGOCIACION` - Con ofertas activas
- `CERRADA` - Operacion completada
- `RECHAZADA` - No aprobada

### Schema `core`

**Tablas principales:**
- `usuarios` - Datos de usuarios
- `organizaciones` - Empresas cedentes y financiadoras
- `roles` - Roles del sistema
- `permisos` - Permisos granulares
- `usuario_organizacion_rol` - Relacion N:M con roles

### Schema `media`

**Tablas principales:**
- `archivos` - Metadata de archivos en MinIO
- `categorias` - Categorias de archivos

---

## Integracion con Storage

### Flujo de Upload de Factura

1. Frontend solicita presigned URL: `GET /storage/presigned-url`
2. ms-core llama a ms-storage-orchestrator
3. ms-storage-orchestrator genera URL firmada de MinIO
4. Frontend sube PDF directamente a MinIO
5. MinIO notifica a ms-storage-orchestrator (webhook)
6. ms-storage-orchestrator encola job en RabbitMQ
7. worker-storage-processor (Rust) procesa OCR
8. Worker notifica a ms-core: `POST /webhook/ocr-completed`
9. ms-core actualiza factura con datos OCR
10. ms-core notifica a frontend via WebSocket

---

## Variables de Entorno

### Vault (Preloaded)

Paths leidos: `JWT`, `DB-SEIS-POSTGRES`, `REDIS`, `SHARED`

```bash
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=myroot
```

### Servicio

```bash
PORT=3001
NODE_ENV=production|development
```

### Base de Datos (desde Vault)

```bash
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=seis_user
DB_PASSWORD=<desde Vault>
DB_DATABASE=seis_erp
```

### Redis (desde Vault)

```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<desde Vault>
```

### MinIO (desde Vault)

```bash
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=<desde Vault>
MINIO_SECRET_KEY=<desde Vault>
MINIO_BUCKET_PRIVATE=seis-private
MINIO_BUCKET_PUBLIC=seis-public
```

---

## Estructura de Directorios

```
src/
├── main.ts                          # Bootstrap + Vault
├── app.module.ts                    # Modulo raiz
├── core/
│   ├── core.module.ts
│   ├── application/
│   │   └── usesCase/
│   │       ├── facturaManager/
│   │       │   └── facturaManager.useCase.ts
│   │       ├── organizacion/
│   │       │   ├── organizacion.usecase.ts
│   │       │   └── acceso.usecase.ts
│   │       └── userPofileAdministrator/
│   │           └── UserProfileAdministrator.usecase.ts
│   └── domain/
│       ├── entities/                # Factura, Usuario, Organizacion
│       ├── model/                   # FacturaUpdateModel, etc.
│       ├── repositories/            # Interfaces TypeORM
│       └── puertos/
│           ├── inbound/             # IFacturaManager, IOrganizacionAdministrator
│           └── outbound/            # IFacturaRepository, IStorageClient
└── infrastructure/
    ├── adapter/
    │   ├── inbound/
    │   │   └── http-server/
    │   │       ├── controllers/     # 10 controllers
    │   │       ├── model/dto/       # DTOs request/response
    │   │       └── decorators/      # @Permissions()
    │   └── outbound/
    │       ├── typeorm/             # Repositorios implementacion
    │       └── http-client/         # Cliente a ms-storage-orchestrator
    └── exceptionFileter/
        └── contacto.filter.ts       # Exception filter (CoreExceptionFilter)
```

---

## Dependencias Criticas

- **PostgreSQL:** Si cae, TODO el dominio deja de funcionar
- **Redis:** Si cae, no hay cache de marketplace (degradacion performance)
- **MinIO (via orchestrator):** Si cae, no se pueden subir/ver facturas
- **RabbitMQ:** Si cae, no se procesan webhooks de OCR

---

## Desarrollo

### Instalar dependencias

```bash
npm install
```

### Iniciar en desarrollo

```bash
npm run start:dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

---

## Docker

### Build

```bash
docker build -t ms-core:latest .
```

### Logs

```bash
docker logs ms-core -f
```

---

## Healthcheck

```bash
curl http://localhost:3001/health
```

---

## Integracion con BFF

El BFF (puerto 3002) es el UNICO cliente HTTP de ms-core. Frontend NUNCA llama directamente a ms-core.

**Patron:**
- BFF orquesta llamadas a ms-core
- BFF agrega datos de ms-auth + ms-core
- BFF valida permisos antes de llamar a ms-core (guards duplicados)

---

## Logs y Debugging

### Logs de NestJS

Cada request incluye:
- `[START]` / `[END]` con duracion en ms
- `correlationId` propagado desde BFF
- Nombre del use case ejecutado

### Ejemplo de log

```
[START] getUrlFacturas correlationId=abc123
[END] getUrlFacturas - Duracion: 45ms
```

---

## Troubleshooting

### Facturas no se listan

1. Verificar permisos del usuario: `GET /user-profile/:uuid/permisos`
2. Revisar logs de ms-core: `docker logs ms-core -f`
3. Verificar conexion PostgreSQL

### OCR no actualiza factura

1. Verificar logs de worker: `docker logs worker-storage-processor -f`
2. Verificar webhook llego a ms-core: buscar `POST /webhook/ocr-completed` en logs
3. Revisar cola RabbitMQ: `docker exec rabbitmq rabbitmqctl list_queues`

---

## Roadmap / Pendiente

- [ ] Definir schemas completos `core.*` y `media.*` en PostgreSQL
- [ ] Circuit breaker para llamadas a ms-storage-orchestrator
- [ ] Cache Redis para catalogos (regiones, bancos)
- [ ] Websocket para notificaciones real-time (marketplace, ofertas)
- [ ] Metricas Prometheus (facturas/min, ofertas/min)
- [ ] Auditoria completa de cambios en facturas
- [ ] Soft delete de facturas (no hard delete)

---

## Referencias

- **MONOREPO_ARCHITECTURE.md** - Arquitectura completa
- **CLAUDE.md** - ADN del proyecto, decisiones tecnicas
- **Graphify:** ~/Documents/Proyectos/SEIS_APP/graphify-out/graph.json
- **FacturaManagerUseCase:** Nodo God con 70+ edges en graphify

---

## Contacto / Contribucion

Este servicio es parte del monorepo SEIS_App. Para cambios:

1. Seguir Clean Architecture: dominio → aplicacion → infraestructura
2. Queries en repositorio, NO en vistas BD
3. Permisos granulares en todos los endpoints (excepto /health)
4. Auditoria de cambios en facturas (CampoEditado[])
5. Actualizar CLAUDE.md si haces cambios arquitectonicos

---

**Ultima actualizacion:** 2026-07-26  
**Maintainer:** Sebastian Parra (@parraSebastian91)
