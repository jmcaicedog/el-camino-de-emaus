-- Actualizar el monto total de servidores de 150000 a 400000
-- Este script corrige el valor incorrecto que se estableció inicialmente

UPDATE servidores
SET monto_total = 400000
WHERE monto_total = 150000;

-- Verificar cuántos registros fueron actualizados
SELECT COUNT(*) as registros_actualizados
FROM servidores
WHERE monto_total = 400000;

-- Mostrar todos los montos para verificar
SELECT 
  nombre_completo,
  monto_total,
  monto_pagado,
  created_at
FROM servidores
ORDER BY created_at DESC;
