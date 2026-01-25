# Solución al Error RLS en Registro de Servidores

## Problema
Error: `new row violates row-level security policy for table "servidores"`

## Causa
Las políticas de Row Level Security (RLS) de Supabase estaban bloqueando las inserciones públicas (sin autenticación) en las tablas `servidores` y `caminantes`.

## Solución Aplicada

### 1. Cambios en el Código ✅

He modificado los endpoints de API para usar el **Service Role Key** en lugar del **Anon Key** para los registros públicos:

- **Archivo modificado**: [app/api/servidores/route.ts](app/api/servidores/route.ts)
- **Archivo modificado**: [app/api/caminantes/route.ts](app/api/caminantes/route.ts)

El Service Role Key bypasea las políticas RLS, permitiendo que usuarios no autenticados se registren correctamente.

### 2. Script SQL Creado (Opcional)

También he creado [scripts/017_fix_rls_public_registration.sql](scripts/017_fix_rls_public_registration.sql) con políticas RLS mejoradas que puedes ejecutar en Supabase si prefieres usar el Anon Key en lugar del Service Role Key.

## Pasos para Desplegar

### Si estás usando Vercel:

1. **Verificar variables de entorno** en Vercel:
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Asegúrate que existe `SUPABASE_SERVICE_ROLE_KEY`
   - Si no existe, agrégala con el valor de tu `.env`

2. **Redesplegar**:
   ```bash
   git add .
   git commit -m "Fix: Resolver error RLS en registro de servidores"
   git push
   ```

### Si estás en desarrollo local:

1. **Reiniciar el servidor**:
   ```bash
   npm run dev
   ```

2. **Probar el formulario** en:
   - http://localhost:3000/registro/servidor

## Verificación

Una vez desplegado, el formulario de registro de servidores debería funcionar sin el error RLS.

## Notas Importantes

⚠️ El Service Role Key bypasea todas las políticas RLS, por lo que solo se usa en el método POST (registro) de los endpoints públicos. Los métodos GET, UPDATE y DELETE siguen protegidos por RLS y requieren autenticación.

✅ Esta es una solución segura para formularios de registro público mientras se mantiene la seguridad en el resto de operaciones.
