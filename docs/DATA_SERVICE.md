# Servicio de Datos - FinanzIA Backend

Este servicio proporciona endpoints para obtener todos los datos de la base de datos de FinanzIA.

## Características

- ✅ Obtener todos los datos de cada tabla
- ✅ Estadísticas de la base de datos
- ✅ Consultas con relaciones incluidas
- ✅ Autenticación requerida para todos los endpoints
- ✅ Logging completo de operaciones
- ✅ Manejo de errores robusto

## Endpoints Disponibles

### Base URL: `/api/v1/data`

**Nota:** Todos los endpoints requieren autenticación (JWT token).

### 1. Obtener todos los datos
```
GET /api/v1/data/all
```
Retorna todos los datos de la base de datos en un solo objeto con resumen.

**Respuesta:**
```json
{
  "success": true,
  "message": "All data retrieved successfully",
  "data": {
    "users": [...],
    "transactions": [...],
    "categories": [...],
    "budgets": [...],
    "chatHistory": [...],
    "refreshTokens": [...],
    "summary": {
      "totalUsers": 5,
      "totalTransactions": 150,
      "totalCategories": 20,
      "totalBudgets": 12,
      "totalChatHistoryRecords": 300,
      "totalRefreshTokens": 8
    }
  }
}
```

### 2. Estadísticas de la base de datos
```
GET /api/v1/data/stats
```
Retorna estadísticas generales sin los datos completos.

**Respuesta:**
```json
{
  "success": true,
  "message": "Database statistics retrieved successfully",
  "data": {
    "totalUsers": 5,
    "totalTransactions": 150,
    "totalCategories": 20,
    "totalBudgets": 12,
    "totalChatHistoryRecords": 300,
    "totalRefreshTokens": 8,
    "totalRecords": 495
  }
}
```

### 3. Obtener usuarios
```
GET /api/v1/data/users
```
Retorna todos los usuarios con sus transacciones, presupuestos, categorías, historial de chat y tokens.

### 4. Obtener transacciones
```
GET /api/v1/data/transactions
```
Retorna todas las transacciones con información de categoría y usuario, ordenadas por fecha (más recientes primero).

### 5. Obtener categorías
```
GET /api/v1/data/categories
```
Retorna todas las categorías con sus relaciones (usuario, transacciones, presupuestos, categorías padre/hijo).

### 6. Obtener presupuestos
```
GET /api/v1/data/budgets
```
Retorna todos los presupuestos con información de categoría y usuario, ordenados por año y mes (más recientes primero).

### 7. Obtener historial de chat
```
GET /api/v1/data/chat-history
```
Retorna todo el historial de chat de IA con información del usuario, ordenado por timestamp (más recientes primero).

### 8. Obtener refresh tokens
```
GET /api/v1/data/refresh-tokens
```
Retorna todos los refresh tokens con información del usuario, ordenados por fecha de creación (más recientes primero).

### 9. Obtener datos de tabla específica
```
GET /api/v1/data/table/:tableName
```
Retorna datos de una tabla específica. Nombres de tabla soportados:
- `users` o `user`
- `transactions` o `transaction`
- `categories` o `category`
- `budgets` o `budget`
- `chathistory`, `chat_history` o `aichathistory`
- `refreshtokens` o `refresh_tokens`

**Ejemplo:**
```
GET /api/v1/data/table/users
```

## Formato de Respuesta

Todas las respuestas siguen el mismo formato:

### Éxito
```json
{
  "success": true,
  "message": "Descripción del resultado",
  "data": [...], // Los datos solicitados
  "count": 10 // Número de registros (cuando aplique)
}
```

### Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos del error"
}
```

## Códigos de Estado HTTP

- `200` - Éxito
- `400` - Solicitud incorrecta (ej: nombre de tabla inválido)
- `401` - No autenticado
- `404` - Recurso no encontrado (ej: tabla no existe)
- `500` - Error interno del servidor

## Autenticación

Todos los endpoints requieren un token JWT válido en el header:

```
Authorization: Bearer <tu_jwt_token>
```

## Ejemplos de Uso

### JavaScript/Fetch
```javascript
const token = 'tu_jwt_token_aqui';

// Obtener todas las transacciones
const response = await fetch('/api/v1/data/transactions', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

### cURL
```bash
# Obtener estadísticas de la base de datos
curl -H "Authorization: Bearer tu_jwt_token_aqui" \
     http://localhost:3000/api/v1/data/stats

# Obtener datos de una tabla específica
curl -H "Authorization: Bearer tu_jwt_token_aqui" \
     http://localhost:3000/api/v1/data/table/users
```

## Consideraciones de Rendimiento

- Los endpoints que retornan todos los datos pueden ser lentos con grandes volúmenes de información
- Se recomienda usar el endpoint `/stats` para obtener solo conteos cuando sea posible
- Los datos incluyen todas las relaciones, lo que puede resultar en respuestas grandes
- Se implementa logging para monitorear el rendimiento de las consultas

## Logging

El servicio registra todas las operaciones:
- Número de registros recuperados
- Errores de base de datos
- Tiempo de respuesta de consultas (en modo desarrollo)

## Seguridad

- ✅ Autenticación JWT requerida
- ✅ Validación de parámetros de entrada
- ✅ Manejo seguro de errores (no expone información sensible)
- ✅ Logging de accesos y errores
