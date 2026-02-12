-- Agregar campo observaciones para caminantes
-- Este campo es solo editable por el líder y colíder de la mesa

ALTER TABLE caminantes
ADD COLUMN observaciones TEXT;

-- Crear índice para mejora de performance
CREATE INDEX idx_caminantes_observaciones ON caminantes(observaciones);
