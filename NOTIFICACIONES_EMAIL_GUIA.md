# 📧 Guía de Configuración de Notificaciones por Email

## 🔍 ¿Cómo funciona el sistema de notificaciones?

El sistema de notificaciones por email está centralizado en:
- **Archivo principal:** `lib/email/send-notification.ts`
- **Proveedor:** Resend (servicio de email)
- **API Key:** Configurada en `RESEND_API_KEY` en `.env`

---

## 📍 Destinatarios de Notificaciones

Las notificaciones se envían a **tres grupos de correos** que se combinan automáticamente:

### 1️⃣ **Correos Explícitos** (parámetro `to`)
Cuando llamas `sendEmailNotification({ to: ['correo@ejemplo.com'] })`, se envía a ese correo específico.

**Ejemplo de uso:**
```typescript
// Notificación al servidor cuando es asignado a un equipo
await sendEmailNotification({
  to: [servidor.correo],  // 👈 Correo explícito
  subject: "Asignación a equipo",
  text: "...",
  html: "<h1>...</h1>"
})
```

### 2️⃣ **Superadministradores** (desde la base de datos)
Cuando `includeSuperAdmins: true` (por defecto), se buscan automáticamente todos los usuarios con:
- `is_super = true` en la tabla `admin_users`
- Se obtiene su campo `email`

**Ejemplo de uso:**
```typescript
// Notificación con copia a todos los superadmins
await sendEmailNotification({
  to: [],
  subject: "Nuevo servidor registrado",
  text: "...",
  html: "...",
  includeSuperAdmins: true  // 👈 Incluye superadmins automáticamente
})
```

### 3️⃣ **Fallback (Variables de Entorno)**
Si no hay superadmins ni destinatarios explícitos, usa las variables:
- `ADMIN_NOTIFICATION_EMAILS` (preferida)
- `NOTIFICATION_EMAILS` (alternativa)

Ambas se configuran en `.env` como una lista separada por comas:

```env
ADMIN_NOTIFICATION_EMAILS=admin@ejemplo.com,gerente@ejemplo.com,supervisor@ejemplo.com
```

---

## 🔧 Cómo Modificar Dónde se Envían las Notificaciones

### **Opción 1: Usar Variable de Entorno (Recomendado para Producción)**

En `.env` o en Vercel (Settings > Environment Variables):

```env
# Correos que siempre reciben notificaciones cuando no hay superadmins configurados
ADMIN_NOTIFICATION_EMAILS=admin@miorganizacion.com,contacto@miorganizacion.com
```

✅ **Ventajas:**
- No requiere cambiar código
- Fácil de modificar sin redeploy
- Ideal para cambios rápidos

---

### **Opción 2: Usar Superadministradores (Recomendado para Producción)**

Los superadministradores se configuran en la base de datos:

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta:

```sql
-- Cambiar is_super a true para marcar como superadmin
UPDATE admin_users
SET is_super = true
WHERE email = 'nuevo-admin@ejemplo.com';

-- Ver los superadmins actuales
SELECT email, nombre_completo, is_super FROM admin_users WHERE is_super = true;
```

3. A partir de ese momento, ese correo recibirá todas las notificaciones donde `includeSuperAdmins: true`

✅ **Ventajas:**
- Centralizado en la BD
- Automático y escalable
- Se usa con `includeSuperAdmins: true` en las llamadas

---

### **Opción 3: Modificar Llamadas Específicas en el Código**

Si necesitas controlar a quién va cada notificación:

```typescript
// Antes (envía solo a superadmins)
await sendEmailNotification({
  to: [],
  subject: "Nuevo servidor",
  text: "...",
  html: "..."
})

// Después (envía a correos específicos + superadmins)
await sendEmailNotification({
  to: ['personal@miemail.com', 'gerente@miemail.com'],
  subject: "Nuevo servidor",
  text: "...",
  html: "...",
  includeSuperAdmins: true
})

// O solo a los correos específicos, sin superadmins
await sendEmailNotification({
  to: ['personal@miemail.com'],
  subject: "Nuevo servidor",
  text: "...",
  html: "...",
  includeSuperAdmins: false  // No incluir superadmins
})
```

---

## 📋 Casos de Uso Actuales en la App

### 📌 Registro de Caminante
- **Dónde:** `app/api/caminantes/route.ts`
- **Va a:** Superadministradores (si están configurados)
- **Código:** `includeSuperAdmins: true`

### 📌 Registro de Servidor
- **Dónde:** `app/api/servidores/route.ts`
- **Va a:** Superadministradores (si están configurados)
- **Código:** `includeSuperAdmins: true`

### 📌 Asignación de Equipo/Actividad
- **Dónde:** `app/api/equipos/[id]/servidores/route.ts`
- **Va a:** Correo del servidor + Superadministradores
- **Código:** `to: [servidor.correo], includeSuperAdmins: true`

### 📌 Promover a Administrador
- **Dónde:** `app/api/admins/route.ts`
- **Va a:** Correo del nuevo admin + Superadministradores
- **Código:** `to: [servidor.correo], includeSuperAdmins: true`

### 📌 Resend de Credenciales
- **Dónde:** `app/api/admins/[id]/resend-credentials/route.ts`
- **Va a:** Correo del admin
- **Código:** `to: [admin.correo]`

---

## 🎯 Pasos Prácticos para Cambiar Correos

### **Escenario 1: Agregar un correo que siempre reciba notificaciones**

```bash
# En el dashboard de Vercel o archivo .env local:
ADMIN_NOTIFICATION_EMAILS=nuevocontacto@empresa.com,otrocontacto@empresa.com
```

### **Escenario 2: Solo los superadmins deben recibir notificaciones**

Elimina la variable `ADMIN_NOTIFICATION_EMAILS` del `.env` y asegúrate de que los correos deseados están marcados con `is_super = true` en la base de datos.

### **Escenario 3: Un correo solo para notificaciones de nuevo servidor**

Modifica `app/api/servidores/route.ts`:

```typescript
// Línea actual (alrededor de 124):
const notificationSent = await sendEmailNotification({ to: [], subject, text, html })

// Cambia a:
const notificationSent = await sendEmailNotification({
  to: ['gerente@empresa.com'],  // 👈 Correo específico
  subject,
  text,
  html,
  includeSuperAdmins: true  // También incluir superadmins
})
```

---

## 📝 Configuración en Vercel

Si la app está en Vercel:

1. Ve a tu proyecto
2. **Settings** → **Environment Variables**
3. Agrega o modifica:
   ```
   ADMIN_NOTIFICATION_EMAILS = admin@empresa.com,contacto@empresa.com
   ```
4. Redeploy para que los cambios tomen efecto

---

## 🧪 Cómo Probar las Notificaciones

Puedes hacer una prueba rápida ejecutando esto en Node.js:

```javascript
const { sendEmailNotification } = require('@/lib/email/send-notification');

await sendEmailNotification({
  to: ['test@ejemplo.com'],
  subject: '🧪 Prueba de Notificación',
  text: 'Si recibes esto, todo funciona correctamente.',
  html: '<h1>🧪 Prueba</h1><p>¡Sistema de notificaciones activo!</p>'
})
```

---

## 🚨 Solución de Problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| No se envía email | Falta `RESEND_API_KEY` | Verifica que la key está en `.env` y es válida |
| Correo llega a otros | `includeSuperAdmins` es true | Cambia a `false` si no quieres que vaya a superadmins |
| Solo va a fallback | No hay superadmins ni `to` | Verifica `ADMIN_NOTIFICATION_EMAILS` en `.env` |
| Redeploy no funciona | Caché de variables | Reconstruye el proyecto en Vercel |

---

## 📞 Resumen de Variables de Entorno

```env
# 🔑 API de Resend (obligatorio)
RESEND_API_KEY=re_xxxxxxxxxxxx

# 📧 Email remitente (formato: "Nombre <correo@dominio>")
RESEND_FROM="Retiro de Emaus <emaus-cristo-rey@juanmanuelcaicedo.com>"

# 📬 Correos fallback (separados por comas, opcional)
ADMIN_NOTIFICATION_EMAILS=admin@empresa.com,contacto@empresa.com
```

---

**¿Necesitas hacer más cambios? Consulta los archivos:**
- 📄 `lib/email/send-notification.ts` - Lógica central
- 📄 `app/api/servidores/route.ts` - Ejemplo de uso
- 📄 `.env` - Variables de configuración
