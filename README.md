# FinanzIA — Backend (Node.js + TypeScript)

![Last commit](https://img.shields.io/github/last-commit/juanfelipe162532/FinanzIA_backend?label=last%20commit)
![Issues](https://img.shields.io/github/issues/juanfelipe162532/FinanzIA_backend)
![License](https://img.shields.io/github/license/juanfelipe162532/FinanzIA_backend)
![Node](https://img.shields.io/github/package-json/node/juanfelipe162532/FinanzIA_backend/dev?label=node)
![Repo size](https://img.shields.io/github/repo-size/juanfelipe162532/FinanzIA_backend)
![TypeScript](https://img.shields.io/badge/TypeScript-Project-blue)

> Backend de **FinanzIA**, una API REST para gestión financiera personal/empresarial con integración de IA para insights, construída con **Node.js**, **Express**, **TypeScript** y **Prisma** sobre **PostgreSQL**.

---

## ✨ Características

* API REST modular (Express + Routers)
* Capa de servicios con **Prisma ORM** (PostgreSQL)
* Autenticación con **JWT** + middlewares de autorización
* Validaciones con **express-validator**
* Seguridad base: **helmet**, CORS, rate limit
* Logs con **Winston**
* Tipado estricto con **TypeScript** y ESLint + Prettier
* Documentación con **OpenAPI/Swagger** (`/api-docs`)
* Scripts de desarrollo, build y despliegue

---

## 🧭 Arquitectura (alto nivel)

```mermaid
flowchart LR
  Client[Frontend / Scripts / Postman]
  Client -->|HTTP JSON| API[Express API]
  API --> MW[Middlewares]
  MW --> C[Controladores]
  C --> S[Servicios]
  S --> DB[(PostgreSQL via Prisma)]
  S --> AI[(IA / Insight Providers)]
  subgraph Observability
    L[Winston Logs]
  end
  API --> L
```

---

## 🗃️ Modelado (referencial)

> Ajusta si tu `schema.prisma` difiere.

```mermaid
classDiagram
  class User {
    id: String
    email: String
    passwordHash: String
    createdAt: DateTime
  }
  class Account {
    id: String
    userId: String
    name: String
    type: String
    createdAt: DateTime
  }
  class Category {
    id: String
    name: String
    type: "INCOME|EXPENSE"
  }
  class Transaction {
    id: String
    accountId: String
    categoryId: String
    amount: Decimal
    date: DateTime
    notes: String
  }
  class Budget {
    id: String
    userId: String
    categoryId: String
    limit: Decimal
    period: String
  }
  User <o-- Account
  Account <o-- Transaction
  Category <o-- Transaction
  User <o-- Budget
  Category <o-- Budget
```

---

## 📈 Indicadores rápidos (dinámicos)

* **Tamaño del repo**: ![Repo size](https://img.shields.io/github/repo-size/juanfelipe162532/FinanzIA_backend)
* **Último commit**: ![Last commit](https://img.shields.io/github/last-commit/juanfelipe162532/FinanzIA_backend?label=fecha)
* **Issues abiertas**: ![Issues](https://img.shields.io/github/issues/juanfelipe162532/FinanzIA_backend)
* **Versión de Node declarada**: ![Node](https://img.shields.io/github/package-json/node/juanfelipe162532/FinanzIA_backend/dev?label=node)

> Estos “gráficos” (badges) se refrescan automáticamente en GitHub. Para dashboards más avanzados, se sugiere integrar **Shield.io JSON endpoints** o **GH Actions** que publiquen métricas.

---

## 📦 Requisitos

* Node.js >= 18
* PostgreSQL >= 12
* npm o yarn

---

## 🚀 Inicio Rápido (Dev)

```bash
# 1) Clonar
git clone https://github.com/juanfelipe162532/FinanzIA_backend.git
cd FinanzIA_backend

# 2) Instalar dependencias
npm install
# o
# yarn

# 3) Variables de entorno
cp .env.example .env
# Edita .env con tu configuración

# 4) Base de datos
# Ajusta DATABASE_URL en .env (PostgreSQL)
npx prisma migrate dev --name init
# (Opcional) datos de ejemplo
npx prisma db seed

# 5) Levantar en desarrollo
npm run dev
# Servirá en http://localhost:3000
```

---

## ⚙️ Variables de entorno

Ejemplo de variables esperadas (ajusta a tu `.env.example`):

```
DATABASE_URL=postgresql://user:pass@localhost:5432/finanzia
PORT=3000
JWT_SECRET=supersecret
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

---

## 🧪 Scripts útiles

> Verifica/ajusta con `package.json` del proyecto.

* `npm run dev` — levantar servidor con hot-reload
* `npm run build` — compilar a producción
* `npm start` — iniciar servidor compilado
* `npm run lint` — revisar lint (ESLint)
* `npm run format` — formatear (Prettier)
* `npx prisma studio` — administrar DB vía UI

---

## 📚 Documentación de la API

* **Swagger UI**: `GET /api-docs` (dev)
* **Listado de endpoints**: ver [`ENDPOINTS.md`](./ENDPOINTS.md) y guías en [`INSTRUCCIONES_API.md`](./INSTRUCCIONES_API.md).

### Ejemplos (curl)

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@demo.com","password":"secret"}'

# Crear transacción (JWT requerido)
curl -X POST http://localhost:3000/api/transactions \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"accountId":"...","categoryId":"...","amount":120000,"date":"2025-08-01","notes":"Suscripción"}'
```

---

## 🔐 Seguridad

* HTTP headers endurecidos con **helmet**
* **CORS** configurado por entorno
* **Rate limiting** en rutas sensibles
* **JWT** con expiración configurable
* **Validaciones** de entrada a nivel DTO/route

> Recomendado: habilitar **rotación de JWT**, **CSRF** si hay cookies, y **secrets** en variables seguras.

---

## 🧩 Estructura del proyecto (referencial)

```
src/
  config/          # configuración (env, prisma, cors)
  routes/          # definición de rutas Express
  controllers/     # controladores HTTP
  services/        # lógica de negocio
  middlewares/     # auth, validación, errores
  utils/           # helpers, formatters
  index.ts         # entrypoint de la app
prisma/
  schema.prisma    # modelos y mapeo
  migrations/      # historial de migraciones
```

---

## 🔄 Flujo de Autenticación

```mermaid
sequenceDiagram
  autonumber
  participant C as Cliente
  participant A as API
  participant DB as PostgreSQL

  C->>A: POST /auth/login (email, password)
  A->>DB: Buscar usuario + hash
  DB-->>A: Usuario válido
  A-->>C: 200 (JWT)
  C->>A: Request a /api/* con Bearer <JWT>
  A-->>C: 200/401 según autorización
```

---

## 🐳 Despliegue con Docker (opcional)

> Si aún no existe un `Dockerfile`, puedes usar este ejemplo mínimo:

```Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node","dist/index.js"]
```

**docker-compose.yml** (Postgres incluido):

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: finanzia
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
  api:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/finanzia
      PORT: 3000
      JWT_SECRET: change-me
    depends_on:
      - db
    ports:
      - "3000:3000"
volumes:
  pgdata:
```

---

## ✅ Healthcheck / Status

* `GET /health` → `{ status: "ok", uptime, version }`
* `GET /metrics` (si se integra Prometheus) → métricas para dashboards

> Sugerencia: añade un **endpoint de status** y un **/metrics** con `prom-client`.

---

## 🧰 Desarrollo y Calidad

* **Lint**: `npm run lint`
* **Format**: `npm run format`
* **Pruebas**: `npm test` / `npm run test:coverage`
* **Husky** (opcional): hooks para pre-commit `lint-staged`

---

## 🛡️ Licencia

Este proyecto usa licencia **MIT**. Consulta [`LICENSE`](./LICENSE) para más detalles.

---

## 🤝 Contribuir

1. Haz fork del repo
2. Crea rama `feature/mi-feature`
3. Commits claros (`feat:`, `fix:`, etc.)
4. PR con descripción, pasos de prueba y screenshots si aplica

---

## 📌 Roadmap breve

* [ ] Endpoint `/health` y `/metrics`
* [ ] CI con GitHub Actions (build + test + lint)
* [ ] Seed de categorías y cuenta demo
* [ ] Ejemplos Postman + colección exportada
* [ ] Alertas de presupuesto con CRON/Queues
* [ ] Integración de IA para insights de gasto

---

## 🧭 Referencias rápidas

* Prisma: [https://www.prisma.io/](https://www.prisma.io/)
