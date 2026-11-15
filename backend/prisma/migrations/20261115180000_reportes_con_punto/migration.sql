-- Coordenada exacta de cada reporte: un derrumbe es un punto de la ruta, no todo el tramo.
ALTER TABLE "reportes" ADD COLUMN "lat" DOUBLE PRECISION,
ADD COLUMN "lon" DOUBLE PRECISION;
