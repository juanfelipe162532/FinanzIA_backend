# 📋 Instrucciones de Uso - API FinanzIA Backend

## 🚀 Inicio Rápido

### 1. Iniciar el Servidor
```bash
npm run dev
```
El servidor se ejecutará en: `http://localhost:3000`

---

## 🔐 Autenticación

### 1. Login (Obtener Token)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "2fb1a28d-6410-44dc-bcea-6b1721c2f6b7",
      "email": "test@example.com",
      "firstName": "Juan",
      "lastName": "Pérez"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Obtener Solo el Token (para usar en otros comandos)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

echo $TOKEN
```

### 3. Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 Gestión de Usuarios

### 1. Obtener Todos los Usuarios
```bash
curl -X GET http://localhost:3000/api/v1/data/users \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Obtener Usuarios (Solo Información Básica)
```bash
curl -X GET http://localhost:3000/api/v1/data/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[] | {id, email, firstName, lastName, createdAt}'
```

### 3. Contar Total de Usuarios
```bash
curl -X GET http://localhost:3000/api/v1/data/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.count'
```

---

## 💰 Transacciones

### 1. Obtener Todas las Transacciones
```bash
curl -X GET http://localhost:3000/api/v1/data/transactions \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Obtener Transacciones Resumidas
```bash
curl -X GET http://localhost:3000/api/v1/data/transactions \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[] | {id, amount, description, date, category: .category.name, user: .user.email}'
```

---

## 📊 Presupuestos

### 1. Obtener Todos los Presupuestos
```bash
curl -X GET http://localhost:3000/api/v1/data/budgets \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Obtener Presupuestos por Usuario
```bash
curl -X GET http://localhost:3000/api/v1/data/budgets \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[] | {user: .user.email, category: .category.name, amount, year, month}'
```

---

## 🏷️ Categorías

### 1. Obtener Todas las Categorías
```bash
curl -X GET http://localhost:3000/api/v1/data/categories \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Obtener Categorías con Jerarquía
```bash
curl -X GET http://localhost:3000/api/v1/data/categories \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[] | {id, name, type, parent: .parent.name, children: [.children[].name]}'
```

---

## 💬 Historial de Chat IA

### 1. Obtener Todo el Historial de Chat
```bash
curl -X GET http://localhost:3000/api/v1/data/chat-history \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Obtener Chat por Usuario
```bash
curl -X GET http://localhost:3000/api/v1/data/chat-history \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[] | {user: .user.email, message, response, timestamp}'
```

---

## 🔑 Tokens de Refresh

### 1. Obtener Todos los Refresh Tokens
```bash
curl -X GET http://localhost:3000/api/v1/data/refresh-tokens \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Ver Tokens Activos por Usuario
```bash
curl -X GET http://localhost:3000/api/v1/data/refresh-tokens \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[] | {user: .user.email, expiresAt, createdAt}'
```

---

## 📈 Estadísticas de la Base de Datos

### 1. Obtener Solo Estadísticas (Rápido)
```bash
curl -X GET http://localhost:3000/api/v1/data/stats \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Obtener Todos los Datos con Resumen
```bash
curl -X GET http://localhost:3000/api/v1/data/all \
  -H "Authorization: Bearer $TOKEN" | jq '.summary'
```

---

## 🗂️ Consultas por Tabla Específica

### 1. Obtener Datos de una Tabla Específica
```bash
# Usuarios
curl -X GET http://localhost:3000/api/v1/data/table/users \
  -H "Authorization: Bearer $TOKEN" | jq

# Transacciones
curl -X GET http://localhost:3000/api/v1/data/table/transactions \
  -H "Authorization: Bearer $TOKEN" | jq

# Categorías
curl -X GET http://localhost:3000/api/v1/data/table/categories \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🔍 Ejemplos de Filtrado con jq

### 1. Usuarios Creados Hoy
```bash
curl -X GET http://localhost:3000/api/v1/data/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq --arg today "$(date +%Y-%m-%d)" '.data[] | select(.createdAt | startswith($today))'
```

### 2. Usuarios con Transacciones
```bash
curl -X GET http://localhost:3000/api/v1/data/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[] | select(.transactions | length > 0)'
```

### 3. Contar Elementos por Tipo
```bash
# Contar usuarios
curl -X GET http://localhost:3000/api/v1/data/stats \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.users'

# Contar transacciones
curl -X GET http://localhost:3000/api/v1/data/stats \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.transactions'
```

---

## 🛠️ Comandos Útiles

### 1. Crear Variable de Token Automática
```bash
# Agregar a tu .bashrc o .zshrc
alias finanzia-token='export TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}" | jq -r ".data.accessToken")'
```

### 2. Función para Consultas Rápidas
```bash
# Agregar a tu .bashrc o .zshrc
finanzia-get() {
    curl -X GET "http://localhost:3000/api/v1/data/$1" \
      -H "Authorization: Bearer $TOKEN" | jq
}

# Uso: finanzia-get users
# Uso: finanzia-get transactions
```

### 3. Verificar Estado del Servidor
```bash
curl -X GET http://localhost:3000/health 2>/dev/null && echo "✅ Servidor funcionando" || echo "❌ Servidor no disponible"
```

---

## 📝 Notas Importantes

1. **Autenticación Requerida**: Todos los endpoints de `/api/v1/data/*` requieren un token JWT válido
2. **Expiración de Token**: Los tokens de acceso expiran en 15 minutos
3. **Formato de Respuesta**: Todas las respuestas siguen el formato `{status, data, count?}`
4. **Relaciones**: Los datos incluyen relaciones completas (usuario → transacciones, categorías, etc.)
5. **Rendimiento**: Para consultas grandes, usa `/stats` en lugar de `/all`

---

## 🚨 Solución de Problemas

### Error 401 - No autorizado
```bash
# Obtener nuevo token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  | jq -r '.data.accessToken')
```

### Error 500 - Error del servidor
```bash
# Verificar logs del servidor
npm run dev
```

### Base de datos no conectada
```bash
# Verificar conexión a PostgreSQL
npx prisma migrate dev --name init
```

---

## 📞 Contacto

Para más información sobre la API, consulta:
- Documentación completa: `/docs/DATA_SERVICE.md`
- Esquema de la base de datos: `/prisma/schema.prisma`
- Logs del servidor: Consola donde ejecutas `npm run dev`
