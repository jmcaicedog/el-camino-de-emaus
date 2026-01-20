-- Agregar campo de colores de camisa para servidores
ALTER TABLE servidores
ADD COLUMN colores_camisa TEXT[];

-- Comentario: Este campo almacena un array con los colores de camisa que necesita el servidor
-- Valores posibles: 'Roja', 'Azul', 'Blanca'
