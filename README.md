# pachamapa

**Dificultades viales y clima en las rutas del norte de Jujuy, tramo por tramo.**

En la Quebrada de Humahuaca el clima cambia en pocos kilómetros: puede estar despejado en Tilcara y haber neblina cerrada en Volcán. Pachamapa muestra en un solo mapa qué pasa en cada tramo de la ruta, combinando el clima automático con los reportes de la gente que está viajando, y avisa por WhatsApp cuando algo se complica.

> **Sobre este proyecto.** Pachamapa se construyó durante el Pre-Hackatón Tren Solar (jujuy.dev), desde el 15 de noviembre de 2026: todo el código de este repositorio se escribió desde cero, como muestra el historial de commits. [Dengue Centinela](https://github.com/EstebanNahuelok/dengue-centinela) es solo una idea previa del equipo, de la que se tomó la inspiración (reportes ciudadanos + clima sobre un mapa) y la elección de tecnologías; no se reutilizó código de ese repositorio.

Este es el **único documento del repo**: reúne lo que antes estaba en `context.md`, `AGENTS.md` y los documentos de estado y de cambios. Si sumás algo, sumalo acá.

**Índice**: [Qué falta](#qué-falta) · [Qué hace](#qué-hace) · [Correrlo en local](#correrlo-en-local) · [Variables de entorno](#variables-de-entorno) · [Deploy](#deploy) · [API](#api) · [Notas para desarrollar](#notas-para-desarrollar) · [Limitaciones](#limitaciones-conocidas)

---

## Qué falta

Estado al 16/11/2026. Todo lo hecho está en la rama `feat/mauro`.

### 1. Configuración (a cargo de Esteban o Damián)

Son claves y cuentas que no están en el repo: cada variable va en `backend/.env` para desarrollo y en las variables de entorno de Render para la versión publicada. Nunca se commitean. El detalle de cada variable está en [Variables de entorno](#variables-de-entorno).

| Qué | Variables | Qué pasa si falta | Dónde se consigue |
|---|---|---|---|
| **Asistente Pacha con IA** | `GROQ_API_KEY` | Pacha solo muestra cinco preguntas frecuentes con respuesta fija; no responde preguntas libres. El texto libre de los reportes se clasifica por palabras clave. | Gratis en https://console.groq.com/keys |
| **Alertas por WhatsApp** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | Las alertas no se envían: solo se escriben en el log del backend. | Cuenta en https://console.twilio.com. Con el sandbox (`+14155238886`) cada número tiene que mandar primero el mensaje de alta; para escribirle a cualquiera hace falta un número de WhatsApp aprobado. |
| **Base de datos de producción** | `DATABASE_URL` | Sin base funcionan mapa, clima y alertas en pantalla; reportes, suscripciones, métricas y lista de espera responden 503. | Neon. **Cambiarle la contraseña** (pasó por un chat) y actualizarla en `backend/.env` y en Render. |
| **Enlaces en los mensajes** | `PUBLIC_URL`, `FRONTEND_URL` | El enlace de baja y el del mapa en cada WhatsApp no apuntan a la versión publicada. | Las URL de Render y de Vercel una vez publicadas. |
| **Frontend publicado** | `VITE_API_URL` (en Vercel) | El frontend publicado no encuentra el backend. Se lee al hacer el build. | La URL del backend en Render. |
| **CORS** | `CORS_ORIGIN` (opcional) | Se aceptan pedidos de cualquier origen. | La URL de Vercel. |

Además de las variables:

- **Publicar con HTTPS** (backend en Render, frontend en Vercel; ver [Deploy](#deploy)). El GPS, el modo sin señal y la pantalla siempre encendida solo funcionan con HTTPS o en `localhost`.
- **Backend siempre encendido**: en el plan gratuito de Render se duerme sin visitas y, dormido, no manda alertas ni busca noticias. Para un servicio de alertas hace falta un plan pago o un ping periódico.
- **Limpiar Neon**: borrar los 11 reportes marcados "PRUEBA" (Tilcara, Volcán y entre Tilcara y Huacalera), el anotado "PRUEBA Devin" de la lista de espera y la visita de prueba antes de mostrar la aplicación.
- **Aplicar las migraciones** en la base de producción: `corepack pnpm prisma migrate deploy` en `backend/` (el build de Render lo hace solo).
- **Licencia de Open-Meteo** si se cobra el plan pago: la API gratuita es para uso no comercial.

### 2. Ramas y subida

- La rama `develop` todavía no existe en GitHub. Se crea con `git push origin feat/mauro:develop`; hace falta un token de GitHub con permiso `repo` (https://github.com/settings/tokens/new) como contraseña. La máquina de Mauro todavía no tiene un token válido guardado.
- No tocar `main` directamente: unir desde `develop` cuando esté probado.
- Si Render y Vercel despliegan desde `main`, lo nuevo no se publica hasta unirlo.

### 3. Probar en el mundo real

- **Viajes por la Argentina con GPS real**: indicaciones por voz, recálculo al salirse del camino y llegada. Se probaron solo con la simulación.

- **Teléfono en la ruta**: GPS, navegación, avisos por voz, pantalla siempre encendida, llamadas del SOS, envío por WhatsApp del contacto, elegir el punto del reporte tocando el mapa y marcar el final con un segundo toque.
- **Pacha con una clave real**: preguntas fuera de tema, pedidos de números de emergencia e intentos de cambiarle las instrucciones.
- **WhatsApp real** con Twilio: alta, alerta, que no se repita y baja.
- **Reportes sin señal** en un teléfono real y desde la pantalla de navegación (se probaron solo en el navegador).
- **Navegación en una smart TV real**, incluido el manejo con las flechas del control remoto.
- **Movimiento reducido** (`prefers-reduced-motion`) en las escenas 3D de la portada.

### 4. Funciones pendientes

En orden sugerido:

1. **"¿Sigue ahí?"**: al pasar navegando por un tramo con reporte, preguntar con dos botones grandes si el problema sigue. Mantiene vivos los reportes reales y saca los viejos antes de que expiren.
2. **Fuentes oficiales**: leer la planilla pública de estado de rutas de Vialidad Nacional, los partes de la Agencia Provincial de Seguridad Vial y las alertas del SMN, para tener cortes sin depender de los reportes.
3. **Acciones de Pacha**: que la respuesta traiga acciones que la app ejecuta (`{ accion: 'abrirTramo', tramoId }`, `reportar`, `alertasWhatsApp`, `emergencia`), validando en el frontend que existan.
4. **Contactos por localidad** en Emergencia (hospital, comisaría, Gendarmería), cada uno con fuente oficial.
5. **Recomendaciones con el pronóstico**: "hay neblina entre Volcán y Tumbaya, salí con más tiempo", "vas a pasar los 4.000 m". Textos de salud y altura con fuente citable.
6. **Calibrar el riesgo** de aludes y crecidas con la cronología real de incidentes y **validar las zonas críticas** con Vialidad y Defensa Civil, en su kilómetro exacto.
7. **Más rutas**: RN 40, RN 66, provinciales y la RN 9 hasta La Quiaca.
8. **Comparar modelos de clima** para saber qué tan confiable es cada pronóstico de neblina.
9. **Mapa que gire con el rumbo** (requiere cambiar Leaflet por algo como MapLibre).
10. **Notificaciones push** además de WhatsApp.

### 5. Mantenimiento

- **Servidor de rutas propio**: los viajes usan el servidor público de demostración de OSRM (`router.project-osrm.org`), que no garantiza disponibilidad ni admite mucho tráfico. Para publicar en serio hay que montar OSRM o Valhalla propio con el mapa de Argentina, o usar un servicio pago, y apuntar `OSRM_URL` ahí.
- **Viajes fuera de Jujuy, a medias**: no tienen reportes de la gente, alertas por WhatsApp, zonas críticas ni mapa sin conexión; solo el clima previsto. El mapa principal sigue mostrando solo Jujuy.

- **Tests del frontend e integración continua**: hoy solo el backend tiene tests (22) y nada los corre en cada cambio.
- **Una sola lógica de alertas**: el armado está escrito dos veces (servidor y modo sin señal) y los textos de los motivos del clima se usan como clave en el frontend.
- **Proteger las métricas** y el contador de visitas, que son públicos y se pueden inflar.
- **Borrar los reportes vencidos** con una tarea periódica y llevar a la base el límite de envíos por IP (hoy vive en memoria y se pierde al reiniciar).
- **Cola persistente de envíos de WhatsApp**, para no perder alertas si el backend se reinicia.
- **Revisión de textos**: los consejos de manejo y los "qué hacer" de cada emergencia son recomendaciones generales; conviene que los revise alguien de Vialidad o Seguridad Vial.
- **Tamaño del build**: el JS supera los 500 KB y Vite lo advierte.

---

## Qué hace

- **Mapa de Jujuy** con la RN 9 (San Salvador de Jujuy – Abra Pampa) y la RN 52 (Purmamarca – Salinas Grandes), pintadas tramo por tramo con el color de su estado.
- **Análisis cada 5 km**: 56 tramos (43 en la RN 9 y 13 en la RN 52), cada uno con su altitud, clima, pronóstico, riesgo, reportes y alertas. Los tramos vecinos con la misma alerta se muestran como una sola.
- **Clima automático**: una sola consulta a Open-Meteo trae los 56 tramos y se renueva cada 15 minutos. Ícono, temperatura y altitud de cada punto.
- **Pronóstico por tramo**: estado previsto hora por hora para 24 horas, con aviso cuando un tramo va a empeorar, y vista a futuro del mapa a 3, 6 o 12 horas.
- **Riesgo de aludes y crecidas** según la lluvia caída y la prevista, más exigente en los tramos con antecedentes; **zonas críticas** con su fuente; **aviso de temporada** (lluvias de noviembre a marzo, nieve y hielo de junio a septiembre).
- **Dificultades viales sobre el mapa**: pictogramas de lo que complica el camino (derrumbe, agua en la calzada, barro, neblina, hielo, corte, baches, obras) y efectos translúcidos animados por zona, con una burbuja de texto; no tapan la ruta.
- **Reportes de la gente**: neblina, corte, derrumbe, crecida, barro o piedras, hielo, nevada, accidente, baches, obras, fila u "otra cosa" con texto libre (clasificado con Groq o por palabras clave). Cada reporte va en un **punto exacto** de la ruta (tocando el mapa o con el GPS); obras, filas y cortes pueden llevar inicio y fin. Expiran solos y, con 2 o más del mismo tipo a menos de 1 km, quedan **confirmados**.
- **Reportes sin señal**: sin conexión el reporte se guarda en el teléfono y se envía solo al volver la señal. Si pasan más de 2 horas se descarta, porque ya no describe la ruta.
- **Cortes y alternativas**: restricción, desvío (solo con antecedente oficial) y enlace al parte de Vialidad Nacional.
- **Alertas por WhatsApp**: cada persona elige localidades o tramos, horario y nivel (solo problemas, o también atención). Elegir un tramo cubre también sus dos vecinos. La misma alerta no se repite durante 6 horas salvo que cambie o empeore; las horas van en hora de Jujuy; cada mensaje trae un enlace de baja.
- **Noticias de los diarios**: cada 5 minutos se buscan en Google Noticias las notas de las últimas 48 horas sobre incidentes en estas rutas, con el nombre del medio y el enlace directo. Son informativas: no cambian el estado ni disparan alertas.
- **Viajes a toda la Argentina**: el botón "Navegar" abre "Planear un viaje". Se busca el destino (y, si se quiere, el origen) por nombre de ciudad, pueblo o municipio, filtrando por provincia, o se elige una provincia y se ve la lista de sus municipios. Quedan guardados los destinos recientes. El camino se calcula con OSRM sobre OpenStreetMap y se muestra entero en el mapa, pintado con el clima previsto a la hora en que se pasa por cada tramo de unos 10 km (Open-Meteo), con la duración, los kilómetros, la hora de llegada y la lista de indicaciones. Al tocar "Iniciar" se navega como en Google Maps: la próxima maniobra con su flecha y distancia ("1,2 km · Doblá a la derecha por RN 34"), la siguiente, el clima complicado que viene, indicaciones por voz, recálculo si te salís del camino y llegada estimada. "Simular" recorre el camino sin moverse. La navegación por tramos de 5 km de la Quebrada sigue disponible desde esa pantalla.
- **Modo navegación** de la Quebrada al estilo Android Auto: sigue la posición, muestra arriba la alerta del tramo actual y la próxima dificultad, al costado el estado de todo el viaje y abajo la hora de llegada. Lo que muestra es lo previsto para la hora en que vas a pasar. Avisos por voz, reporte en el tramo actual, mapa oscuro de noche y dos simulaciones (con datos reales, y una demo de Maimará a Huacalera con alertas simuladas). **En monitores y smart TV** (desde 1024 px) las tarjetas y el "Camino por delante" quedan en una columna a la izquierda, siempre a la vista; desde 1800 px se agranda todo para leerse de lejos.
- **Antes de salir**: lista de control de 10 puntos (cinturón, luces, teléfono en el soporte, combustible, avisar a alguien…) que queda guardada en el teléfono, y consejos según el camino (niebla, lluvia, hielo, viento, derrumbes, cuesta, altura), también por voz durante el viaje. Con un contacto cargado, ofrece avisarle que salís.
- **A quién llamar**: seis situaciones (choque, alguien descompuesto, incendio, derrumbe o crecida, robo, ruta cortada) con el número a llamar primero y el 911 de respaldo.
- **Emergencia (SOS)**: contacto propio guardado en el teléfono, números oficiales con su fuente (911, 107 SAME, 100 Bomberos, 103 Defensa Civil, 0800-222-6272 Vialidad Nacional) y la ubicación lista para decir por teléfono. Funciona sin datos.
- **Pacha, el asistente**: un cardón de la Quebrada que explica cómo usar la app y responde sobre el estado de la ruta con los datos del momento (tramos, alertas, noticias). Sin conexión o sin clave muestra cinco preguntas frecuentes. No guarda las conversaciones.
- **Sin conexión**: desde la primera visita quedan guardados la aplicación, el mapa de toda la zona (zoom 8 a 10, y 11 a 12 cerca de las rutas; unas 182 imágenes, 3 MB, una vez por semana) y los últimos datos. Sin internet abre igual y estima el estado con el último pronóstico recibido.
- **Portada en cinco páginas** (Inicio, Cómo funciona, Antes de salir, A quién llamar y Pacha), cada una con su efecto 3D en CSS, sin librerías. **Tema claro y oscuro**, que sigue al del teléfono si no se elige.
- **Instalable** en la pantalla de inicio (manifiesto e íconos). Sin registrarse.

### Localidades de referencia

Los tramos de 5 km se nombran según estas localidades (por ejemplo, "Entre Uquía y Humahuaca").

| Tramo | Ruta | Altitud |
|---|---|---|
| San Salvador de Jujuy | RN 9 | 1.259 m |
| Volcán | RN 9 | 2.084 m |
| Tumbaya | RN 9 | 2.094 m |
| Purmamarca | RN 52 | 2.324 m |
| Maimará | RN 9 | 2.334 m |
| Tilcara | RN 9 | 2.465 m |
| Huacalera | RN 9 | 2.641 m |
| Uquía | RN 9 | 2.818 m |
| Humahuaca | RN 9 | 2.939 m |
| Abra Pampa | RN 9 | 3.484 m |
| Cuesta de Lipán | RN 52 | 4.170 m |
| Salinas Grandes | RN 52 | 3.450 m |

### Cómo se calcula el estado

| Estado | Por clima | Por reportes |
|---|---|---|
| Problemas | Visibilidad menor a 200 m, lluvia fuerte, nevada fuerte, tormenta o ráfagas de 80 km/h o más | Evento grave confirmado (2 o más reportes iguales) |
| Atención | Neblina, lluvia o llovizna, nevada leve, ráfagas de 50 km/h o más, temperatura bajo cero, riesgo alto de aludes o crecidas | Cualquier reporte activo sin confirmar, o filas |
| Bien | Nada de lo anterior | Sin reportes activos |

Los reportes expiran solos: neblina y filas a las 2 horas, accidentes a las 3, hielo, nevadas, crecidas y barro a las 5, cortes y derrumbes a las 8, obras a las 12 y baches a las 24.

### Cómo se calcula el riesgo de aludes y crecidas

Se suma la lluvia de las últimas 24 horas, la mitad de la de los dos días anteriores y la prevista para las próximas 24 (Open-Meteo). En tramos con zonas críticas el riesgo es moderado desde 10 mm y alto desde 25 mm, o si se espera una hora de 10 mm o más; en el resto, desde 25 y 50 mm (o una hora de 20 mm). Los umbrales están en `backend/src/services/riesgo.js` y son orientativos. Las zonas críticas están en `backend/src/data/zonasCriticas.js` y los desvíos en `backend/src/data/alternativas.js`.

### Tracción y modelo de negocio

El mapa es gratuito para quien viaja. El plan pago apunta a agencias de turismo, transportistas y guías, con alertas por tramo y horario antes de salir. La aplicación registra visitas, visitantes únicos, reportes, suscriptores y anotados en la lista de espera (`GET /api/metricas`).

---

## Correrlo en local

Requisitos: Node 20 o superior, Docker (o una base Postgres propia). pnpm se usa a través de corepack: `corepack pnpm <comando>`, no hace falta instalarlo.

```bash
# 1. Base de datos local (Postgres en el puerto 5433), o usar la de Neon en el paso 2
docker compose up -d

# 2. Backend
cd backend
corepack pnpm install
cp .env.example .env                # completar lo que haga falta (ver Variables de entorno)
corepack pnpm prisma migrate deploy # crea las tablas
corepack pnpm dev                   # http://localhost:3001
corepack pnpm test                  # tests del backend

# 3. Frontend (en otra terminal)
cd frontend
corepack pnpm install
corepack pnpm dev                   # http://localhost:5173 (redirige /api al backend)
corepack pnpm build && corepack pnpm lint
```

**Para probar el modo sin señal** no sirve `pnpm dev` (ahí el service worker no se registra): usar `corepack pnpm build` y `corepack pnpm exec vite preview` (http://localhost:4173), entrar una vez con conexión y después cortarla.

**Para probar en el teléfono**: con el backend corriendo, `corepack pnpm build` y `corepack pnpm exec vite preview --port 4173` en `frontend`, y `cloudflared tunnel --url http://localhost:4173`. La dirección es temporal y cambia cada vez; `vite.config.ts` ya acepta `.trycloudflare.com`.

**Test en Salta**: para desarrollar con GPS real desde Salta capital hay dos rutas de prueba con clima real, Cerrillos – Vaqueros (27 km) e Hiper Libertad – San Luis (10 km). Solo aparecen con `?prueba=salta` o eligiendo "TEST EN SALTA" en la navegación, no generan alertas por WhatsApp y no se unen con las rutas de Jujuy.

## Variables de entorno

Plantillas en `backend/.env.example` y `frontend/.env.example`.

| Dónde | Variable | Para qué |
|---|---|---|
| backend | `DATABASE_URL` | Connection string de Postgres (en Neon, la directa, no la "pooled"). Sin base, el mapa y el clima funcionan; reportes, suscripciones, métricas y lista de espera responden 503. |
| backend | `GROQ_API_KEY` | Opcional. Asistente Pacha y clasificación del texto libre de los reportes. |
| backend | `GROQ_MODEL` | Opcional. Modelo de clasificación (por defecto `llama-3.1-8b-instant`). |
| backend | `GROQ_MODEL_ASISTENTE` | Opcional. Modelo de Pacha (por defecto `llama-3.3-70b-versatile`). |
| backend | `CORS_ORIGIN` | Opcional. Orígenes permitidos separados por coma (vacío = todos). |
| backend | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | Opcional. Credenciales y número de WhatsApp de Twilio (sandbox: `+14155238886`). Sin las tres, las alertas solo se escriben en el log. |
| backend | `PUBLIC_URL` | Opcional. URL pública del backend, para el enlace de baja (en Render se detecta sola). |
| backend | `FRONTEND_URL` | Opcional. URL del mapa, que va en cada alerta. |
| backend | `ALERTAS_REPETIR_HORAS` | Opcional. Horas antes de repetir un aviso que sigue igual (por defecto 6). |
| backend | `NOTICIAS`, `NOTICIAS_MINUTOS`, `NOTICIAS_HORAS` | Opcional. `NOTICIAS=no` desactiva las noticias; las otras cambian cada cuántos minutos se consultan (5) y de cuántas horas para atrás (48). |
| backend | `OSRM_URL` | Opcional. Servidor de rutas OSRM (por defecto el público de demostración, `https://router.project-osrm.org`). |
| backend | `PORT` | Puerto (por defecto 3001). |
| frontend | `VITE_API_URL` | URL pública del backend. Se lee **al hacer el build**; en desarrollo se deja vacía. |

Después de cambiar `backend/.env` hay que reiniciar el backend.

## Deploy

1. **Neon**: crear un proyecto y copiar la connection string directa.
2. **Render**: New → Blueprint → elegir este repo (usa `render.yaml`) y cargar las variables del backend. El build aplica las migraciones solo.
3. **Vercel**: importar el repo con *Root Directory* `frontend` y definir `VITE_API_URL` con la URL de Render antes del primer build.
4. Opcional: en Render, poner en `CORS_ORIGIN` la URL de Vercel y en `FRONTEND_URL` la misma URL.

## API

| Método y ruta | Descripción |
|---|---|
| `GET /api/tramos` | Clima, estado, motivos, reportes activos, pronóstico, riesgo, zonas críticas, restricción e historial de cada tramo, más las alertas y las `noticias`. Es la respuesta que se guarda para usar sin conexión. |
| `GET /api/tramos?prueba=salta` | Lo mismo, más las rutas de prueba de Salta. |
| `POST /api/reportes` | Crea un reporte: `{ tipo?, tramoId?, lat?, lon?, latFin?, lonFin?, comentario? }`. Sin `tipo` se clasifica el comentario; sin `tramoId` se usa el tramo más cercano. Límite: 8 cada 10 minutos por IP. |
| `GET /api/reportes` | Reportes activos. |
| `POST /api/alertas/suscripciones` | Alta o cambio de una suscripción: `{ telefono, nombre?, tramos?, nivel?, desdeHora?, hastaHora? }`. `tramos` acepta ids de localidad o de tramo; sin `tramos` se avisa por todo. `nivel` es `problemas` (por defecto) o `atencion`. Límite: 5 altas por hora por IP. |
| `GET /api/alertas/baja/:token` | Da de baja una suscripción (el enlace de cada mensaje). |
| `GET /api/asistente` | Si Pacha puede responder con IA (`disponible`). |
| `POST /api/asistente` | Pregunta a Pacha: `{ mensajes: [{ rol, texto }] }`. 503 sin `GROQ_API_KEY`. Límite: 20 preguntas cada 10 minutos por IP y 500 caracteres por mensaje. |
| `GET /api/provincias` | Las 24 provincias con su centro (Georef). |
| `GET /api/lugares?q=&provincia=` | Ciudades, pueblos y municipios que coinciden con `q`, opcionalmente de una provincia; sin `q`, los municipios de la provincia. |
| `GET /api/viaje?desde=lat,lon&hasta=lat,lon` | Camino (`linea`), `indicaciones` en castellano con su kilómetro, `total` en km, `duracion` en segundos y `tramos` de ~10 km con el clima y el estado previstos a la hora de paso. Límite: 40 cada 10 minutos por IP. |
| `POST /api/visitas` | Registra una visita. |
| `GET /api/metricas` | Visitas, visitantes únicos, reportes, suscriptores y anotados en la lista de espera. |
| `POST /api/lista-espera` | Suma un interesado: `{ nombre, contacto, rubro, mensaje? }`. |
| `GET /api/health` | Estado del servicio. |

## Estructura

```
pachamapa/
├── backend/            API Express, Prisma y servicios (clima, reportes, alertas, WhatsApp, noticias, asistente)
├── frontend/           Aplicación web (portada, mapa, navegación, reportes, Pacha)
├── scripts/            Generan el trazado de las rutas y los tramos de 5 km
├── docker-compose.yml  Postgres local para desarrollo
└── render.yaml         Configuración del backend en Render
```

**Stack**: Node.js + Express, Prisma + Postgres (Neon), Groq, Open-Meteo y Twilio en el backend; React + Vite + TypeScript, Tailwind y Leaflet en el frontend. Deploy en Render (backend) y Vercel (frontend).

### Dónde está cada cosa

| Función | Archivos |
|---|---|
| Tramos de 5 km con clima, pronóstico, riesgo y reportes | `backend/src/routes/tramos.js`, `backend/src/services/tramos.js` (`calcularTramos`), `backend/src/data/tramos.json` |
| Alertas en la app | `backend/src/services/alertas.js` (`armarAlertas`), `frontend/src/components/Alertas.tsx` |
| Alertas por WhatsApp | `backend/src/services/whatsappAlertas.js`, `backend/src/services/whatsapp.js`, `backend/src/routes/alertas.js`, `frontend/src/components/AlertasWhatsApp.tsx`. Tablas `suscripciones` y `alertas_enviadas` |
| Noticias | `backend/src/services/noticias.js`, `frontend/src/components/Noticias.tsx` |
| Reportes con punto exacto | `backend/src/routes/reportes.js`, `backend/src/data/tiposReporte.js`, `frontend/src/lib/reportes.ts`, `frontend/src/components/FormularioReporte.tsx` |
| Reportes sin señal | `frontend/src/lib/reportesPendientes.ts` (cola `pm-reportes-pendientes`) |
| Navegación | `frontend/src/components/Navegacion.tsx`, `MapaNavegacion.tsx` |
| Emergencia y a quién llamar | `frontend/src/lib/emergencia.ts`, `frontend/src/components/Emergencia.tsx`, `frontend/src/components/Seguridad.tsx` (`AQuienLlamar`) |
| Antes de salir y consejos | `frontend/src/lib/consejos.ts`, `frontend/src/components/ConsejosViaje.tsx`, `Seguridad.tsx` (`AntesDeSalir`, lista `pm-lista-salida`) |
| Pacha | `backend/src/services/asistente.js`, `backend/src/routes/asistente.js`, `frontend/src/components/Asistente.tsx`, dibujo en `frontend/src/components/Pacha.tsx` |
| Portada en páginas | `frontend/src/components/Portada.tsx`, `frontend/src/lib/paginas.ts`, `frontend/src/Raiz.tsx` (decide portada o mapa según el `#` de la dirección: `#inicio`, `#como-funciona`, `#seguridad`, `#a-quien-llamar`, `#pacha`, `#mapa`, `#mapa-pacha`) |
| Efectos sobre el mapa | `frontend/src/lib/efectosMapa.ts`, `frontend/src/components/Mapa.tsx`, clases `pm-fx-*` en `index.css` |
| Tema claro y oscuro | `frontend/src/lib/tema.ts`, `frontend/src/components/BotonTema.tsx`, variables `--pm-*` en `index.css` |
| Sin conexión | `frontend/public/sw.js`, `frontend/src/lib/offline.ts` |
| Marca | `frontend/public/marca/`, `frontend/public/fonts/`, clase `pm-marca` |

## Notas para desarrollar

- **Idioma**: código, comentarios y textos en español rioplatense (voseo).
- **pnpm**: no está instalado globalmente; usar `corepack pnpm <comando>` dentro de `backend/` o `frontend/`.
- **Verificación antes de commitear**: `corepack pnpm test` en `backend/`; `corepack pnpm build` y `corepack pnpm lint` en `frontend/`. El lint tiene una advertencia conocida (`set-state-in-effect`) y cero errores.
- **Prisma**: si el backend falla con "@prisma/client did not initialize yet", correr `corepack pnpm exec prisma generate`. Después de cambiar `backend/prisma/schema.prisma`, frenar el backend antes de `prisma generate` (en Windows el motor queda bloqueado) y aplicar con `corepack pnpm exec prisma migrate deploy`.
- **Tramos**: los genera `node scripts/generar-tramos.mjs`, que escribe `backend/src/data/tramos.json` y `frontend/src/data/tramos-geo.json`. No editarlos a mano; volver a correrlo si cambia el trazado o se suma una localidad (`backend/src/data/puntos.js`).
- **Motivos del clima**: el texto de cada motivo (`backend/src/services/estado.js`) se usa como clave en `frontend/src/lib/dificultades.ts`; si se cambia, hay que cambiarlo en los dos lados.
- **Reportes con punto**: guardan `lat`/`lon` y, en obras, filas y cortes, `latFin`/`lonFin`. `estado` del tramo cuenta todos los reportes; `estadoLinea` es el color con que se pinta y deja afuera los reportes con punto, que se dibujan solo en su lugar.
- **Colores y temas**: usar las utilidades de Tailwind de siempre (`bg-white`, `text-stone-600`…); `index.css` las cambia según el tema, así que un componente nuevo ya funciona en claro y oscuro. No usar colores fijos en `style` salvo los de estado. La navegación usa `pm-fijo` (siempre oscura).
- **Componentes de referencia**: `pm-tarjeta`, `pm-titulo` y `pm-contador` para secciones (`Alertas.tsx`, `Noticias.tsx`); `Modal.tsx` para ventanas; `AlertasWhatsApp.tsx` para formularios.
- **Sin dependencias nuevas** si se puede evitar, y efectos 3D solo con CSS: la app se abre en la ruta, con poca señal.
- **Sin conexión**: lo que tenga que funcionar sin señal tiene que estar en el frontend o venir dentro de `GET /api/tramos`, que es la respuesta que se guarda.
- **Responsive**: el celular es el diseño principal; las mejoras para pantallas grandes van con prefijos `lg:` o media queries de ancho, sin cambiar la vista de celular.
- **Comandos largos**: los comandos de shell de más de ~8.000 caracteres se cortan; para archivos grandes usar la herramienta de escritura.

## Limitaciones conocidas

- La visibilidad de Open-Meteo sale de un modelo de varios kilómetros de resolución, no de una estación en la ruta: sirve como alerta y se complementa con los reportes. Dos tramos vecinos difieren más por la altitud que por el clima.
- Un derrumbe o el agua sobre la calzada solo aparecen si alguien los reporta.
- Un reporte se confirma por cantidad de envíos, no por personas distintas.
- El riesgo de aludes y crecidas es una estimación por lluvia con umbrales sin calibrar. Las zonas críticas salen de noticias y publicaciones, no de un relevamiento oficial.
- Los consejos de manejo son recomendaciones generales; los tramos de cuesta se deducen del desnivel entre tramos (más de 200 m).
- Los kilómetros se cuentan desde San Salvador de Jujuy (RN 9) y desde el empalme (RN 52): no son los mojones oficiales.
- La navegación calcula las llegadas con la velocidad del GPS o, si no la hay, a 60 km/h. El mapa queda siempre con el norte arriba.
- Sin señal, la estimación cubre solo las 24 horas del último pronóstico, y los reportes guardados vencen a las 2 horas.
- El mapa sin conexión usa imágenes de OpenStreetMap (unas 182 por teléfono, una vez por semana). Es poco, pero si la app crece conviene un proveedor de teselas propio.
- El enlace directo de las noticias usa un mecanismo interno de Google; si cambia, queda el enlace de Google, que igual redirige al diario. Las noticias se ubican por el titular.
- Las alertas por WhatsApp no verifican que el número sea de quien se suscribe, y solo sirven para avisar: los reportes se cargan desde la web.
- El parte de Vialidad Nacional se enlaza pero no se lee automáticamente.
- Pacha es una ayuda, no una fuente oficial, y solo da los cinco teléfonos oficiales cargados.

## Equipo

- Esteban ([@EstebanNahuelok](https://github.com/EstebanNahuelok))
- Damián
- Mauro Gomez

## Créditos

- Datos del clima: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
- Mapa base y trazado de las rutas: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL); el trazado se obtuvo con OSRM.
- Desarrollo asistido con IA (Devin), como figura en los commits.
