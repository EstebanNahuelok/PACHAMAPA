# Pachamapa: notas para agentes

- pnpm no está instalado globalmente: usar `corepack pnpm <comando>` dentro de `backend/` o `frontend/`.
- Backend: `corepack pnpm dev` (puerto 3001), `corepack pnpm test` (node --test). Si falla con "@prisma/client did not initialize yet", correr `corepack pnpm exec prisma generate`.
- Frontend: `corepack pnpm dev` (puerto 5173, redirige `/api` al backend), `corepack pnpm lint`, `corepack pnpm build`.
- Sin `DATABASE_URL` el mapa, el clima, el pronóstico y las alertas funcionan; reportes, métricas y lista de espera responden 503.
- El lint tiene una advertencia conocida en `App.tsx` (`set-state-in-effect`).
- El service worker (`frontend/public/sw.js`) solo se registra en el build de producción; para probar el modo sin señal usar `corepack pnpm build` y `corepack pnpm exec vite preview`.
- El motivo de cada estado del clima (`backend/src/services/estado.js`) se usa como clave en `frontend/src/lib/dificultades.ts`: si se cambia un texto, hay que cambiarlo en los dos lados.
- La unidad de análisis son tramos de 5 km (`backend/src/data/tramos.json`), generados con `node scripts/generar-tramos.mjs`. Las localidades de `puntos.js` solo sirven para nombrarlos.
- Los comandos de shell largos (más de ~8.000 caracteres) se cortan: para archivos grandes usar la herramienta de escritura.
- Los reportes se ubican en un punto exacto de la ruta (`lat`, `lon`) y, en obras, filas y cortes, pueden llevar un final (`latFin`, `lonFin`). `estado` del tramo cuenta todos los reportes (alertas, lista, navegación); `estadoLinea` es el color con que se pinta y deja afuera los reportes con punto, que se dibujan solo en su lugar.
- Después de cambiar `backend/prisma/schema.prisma` hay que frenar el backend antes de `prisma generate` (en Windows el motor queda bloqueado) y aplicar la migración con `corepack pnpm exec prisma migrate deploy`.
