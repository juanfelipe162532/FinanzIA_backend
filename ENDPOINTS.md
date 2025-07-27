# FinanzIA Backend - Lista de Endpoints

## Autenticación (`/api/v1/auth`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| POST | `/register` | Registro de usuario | Público |
| POST | `/login` | Inicio de sesión | Público |
| POST | `/logout` | Cerrar sesión | Público |
| POST | `/refresh-token` | Renovar token de acceso | Público |

## Usuarios (`/api/v1/users`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/:id` | Obtener usuario específico | Privado |
| PUT | `/:id` | Actualizar usuario | Privado |
| DELETE | `/:id` | Eliminar usuario | Privado |
| GET | `/:id/profile` | Obtener perfil del usuario | Privado |
| PUT | `/:id/profile` | Actualizar perfil del usuario | Privado |

## Transacciones (`/api/v1/transactions`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/` | Obtener transacciones del usuario | Privado |
| POST | `/` | Crear nueva transacción | Privado |
| GET | `/stats` | Obtener estadísticas de transacciones | Privado |
| GET | `/:id` | Obtener transacción específica | Privado |
| PUT | `/:id` | Actualizar transacción | Privado |
| DELETE | `/:id` | Eliminar transacción | Privado |

### Parámetros de consulta para GET `/transactions`:
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `type`: Filtrar por tipo ('income' o 'expense')
- `categoryId`: Filtrar por ID de categoría
- `startDate`: Fecha de inicio (formato ISO)
- `endDate`: Fecha de fin (formato ISO)

## Categorías (`/api/v1/categories`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/` | Obtener categorías del usuario | Privado |
| POST | `/` | Crear nueva categoría | Privado |
| GET | `/system` | Obtener categorías del sistema | Privado |
| GET | `/:id` | Obtener categoría específica | Privado |
| PUT | `/:id` | Actualizar categoría | Privado |
| DELETE | `/:id` | Eliminar categoría | Privado |

### Parámetros de consulta para GET `/categories`:
- `type`: Filtrar por tipo ('income' o 'expense')
- `includeSystem`: Incluir categorías del sistema (default: 'true')

## Presupuestos (`/api/v1/budgets`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/` | Obtener presupuestos del usuario | Privado |
| POST | `/` | Crear nuevo presupuesto | Privado |
| GET | `/current` | Obtener presupuestos del mes actual | Privado |
| GET | `/:id` | Obtener presupuesto específico | Privado |
| PUT | `/:id` | Actualizar presupuesto | Privado |
| DELETE | `/:id` | Eliminar presupuesto | Privado |

### Parámetros de consulta para GET `/budgets`:
- `month`: Filtrar por mes (1-12)
- `year`: Filtrar por año

## Inteligencia Artificial (`/api/v1/ai`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| POST | `/chat` | Enviar mensaje al AI | Privado |
| GET | `/history` | Obtener historial de chat del usuario | Privado |
| DELETE | `/history` | Limpiar historial de chat | Privado |
| GET | `/suggestions` | Obtener sugerencias financieras | Privado |

### Parámetros de consulta para GET `/ai/history`:
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 20)

### Parámetros de consulta para GET `/ai/suggestions`:
- `type`: Tipo de sugerencias ('general', 'budgeting', 'savings', etc.)

## Dashboard (`/api/v1/dashboard`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/summary` | Obtener resumen financiero | Privado |
| GET | `/charts` | Obtener datos para gráficos | Privado |
| GET | `/trends` | Obtener tendencias de gastos/ingresos | Privado |
| GET | `/metrics` | Obtener métricas de rendimiento | Privado |

### Parámetros de consulta para endpoints del dashboard:
- `period`: Período de análisis ('week', 'month', 'year')
- `type`: Tipo de gráfico ('all', 'category', 'timeline', 'budget')

## Datos (Administración) (`/api/v1/data`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|---------|
| GET | `/all` | Obtener todos los datos | Privado |
| GET | `/stats` | Obtener estadísticas de la BD | Privado |
| GET | `/users` | Obtener todos los usuarios | Privado |
| GET | `/transactions` | Obtener todas las transacciones | Privado |
| GET | `/categories` | Obtener todas las categorías | Privado |
| GET | `/budgets` | Obtener todos los presupuestos | Privado |
| GET | `/chat-history` | Obtener todo el historial de chat | Privado |
| GET | `/refresh-tokens` | Obtener todos los refresh tokens | Privado |
| GET | `/table/:tableName` | Obtener datos de tabla específica | Privado |

## Estructura de Respuesta

Todas las respuestas siguen el siguiente formato:

```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "count": number (opcional),
  "pagination": {
    "currentPage": number,
    "totalPages": number,
    "totalItems": number,
    "itemsPerPage": number,
    "hasNextPage": boolean,
    "hasPrevPage": boolean
  } (opcional)
}
```

## Autenticación

Todos los endpoints privados requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

## Códigos de Estado HTTP

- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Error en la solicitud
- `401`: No autorizado
- `404`: No encontrado
- `500`: Error interno del servidor

## Ejemplos de Uso

### Crear una transacción:
```bash
POST /api/v1/transactions
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 50.00,
  "type": "expense",
  "description": "Almuerzo",
  "categoryId": "64f8b1234567890123456789",
  "date": "2024-01-15T12:00:00Z"
}
```

### Obtener transacciones con filtros:
```bash
GET /api/v1/transactions?type=expense&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=10
Authorization: Bearer <token>
```

### Crear un presupuesto:
```bash
POST /api/v1/budgets
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 500.00,
  "categoryId": "64f8b1234567890123456789",
  "month": 1,
  "year": 2024
}
```

### Enviar mensaje al AI:
```bash
POST /api/v1/ai/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "¿Cómo puedo ahorrar más dinero este mes?",
  "context": {
    "currentExpenses": 1200,
    "budget": 1500
  }
}
```
