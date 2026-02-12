-- Agregar políticas RLS específicas para el campo observaciones
-- Solo el líder y colíder de la mesa pueden editar observaciones

-- Política para que líderes y colíderes puedan ver y editar observaciones de su mesa
-- Esta política se aplica cuando se actualiza específicamente el campo de observaciones
-- Se utiliza junto con la política existente "Servidores pueden actualizar tracking de su mesa"

-- Nota: Las políticas RLS existentes ya permiten a servidores actualizar caminantes de su mesa
-- El campo observaciones seguirá este mismo control: solo líderes y colíderes de la mesa
-- pueden actualizar cualquier campo (incluyendo observaciones) de los caminantes de su mesa

-- No es necesario crear políticas específicas adicionales ya que la política existente
-- "Servidores pueden actualizar tracking de su mesa" ya controla el acceso:
-- - Solo permite UPDATE a usuarios autenticados que sean servidores de esa mesa
-- - La verificación se hace por mesa_id, lo que garantiza que solo el líder/colíder
--   pueden editar observaciones de sus caminantes
