-- Final de un reporte con largo propio (obras, filas, cortes): va de un punto a otro de la ruta.
ALTER TABLE "reportes" ADD COLUMN "lat_fin" DOUBLE PRECISION,
ADD COLUMN "lon_fin" DOUBLE PRECISION;
