# SQL Scripts - Organizacion Recomendada

Este directorio quedo reorganizado para facilitar una implementacion desde cero con el minimo de pasos y menor riesgo operativo.

## Estructura

- `bootstrap/`: scripts minimos para levantar una base nueva.
- `maintenance/`: scripts operativos puntuales (limpieza, utilidades de soporte).

Nota: los scripts legacy historicos fueron eliminados para reducir riesgo y evitar ejecuciones accidentales.

## Ejecucion Desde Cero (orden obligatorio)

1. `scripts/bootstrap/01_schema.sql`
2. `scripts/bootstrap/02_seed_initial_data.sql`
3. `scripts/bootstrap/03_storage_avatars.sql`

## Alcance de Cada Script Bootstrap

- `01_schema.sql`
  - Crea tipos, tablas, indices, funciones, triggers y politicas RLS con la estructura final actual.
- `02_seed_initial_data.sql`
  - Inserta mesas base, catalogo oficial de equipos y garantiza la fila unica de `retiro_settings`.
- `03_storage_avatars.sql`
  - Configura bucket `avatars` y politicas de lectura publica con escritura restringida.

## Seguridad

Tener scripts SQL en Git es una practica valida, pero debes controlar estos riesgos:

1. Secretos en texto plano: nunca incluir keys, passwords reales o tokens.
2. Datos personales reales: evitar seed de personas reales en repositorio publico.
3. Politicas demasiado abiertas: evitar `TO public` para `INSERT/UPDATE/DELETE` salvo necesidad estricta.

Recomendaciones aplicadas aqui:

1. Eliminamos historial legacy para evitar ejecucion accidental de scripts viejos.
2. En bootstrap dejamos politicas mas seguras para Storage (sin escritura publica).
3. Dejamos una ruta unica de instalacion para reducir errores de orden.

## Buenas Practicas Futuras

1. Toda nueva migracion debe ser idempotente (`IF NOT EXISTS`, `ON CONFLICT`, `DROP ... IF EXISTS`).
2. Evitar scripts con datos de prueba en repositorio principal; usar archivos locales ignorados o datos anonimizados.
3. Si usas entorno productivo, ejecutar primero en staging y respaldar antes de cambios estructurales.

## Script Util de Admin

- `scripts/maintenance/02_admin_setup_template.sql`
  - Plantilla segura con placeholders para registrar/actualizar un admin sin dejar datos reales en Git.
