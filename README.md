# pachamapa

**Dificultades viales y clima en las rutas del norte de Jujuy, tramo por tramo.**

En la Quebrada de Humahuaca el clima cambia en pocos kilómetros: puede estar despejado en Tilcara y haber neblina cerrada en Volcán. Pachamapa muestra en un solo mapa qué pasa en cada tramo de la ruta, combinando el clima automático con los reportes de la gente que está viajando.

> **Sobre este proyecto.** Pachamapa se construyó íntegramente durante el Pre-Hackatón Tren Solar (jujuy.dev), el 15 de noviembre de 2026: todo el código de este repositorio se escribió desde cero ese día, como muestra el historial de commits. [Dengue Centinela](https://github.com/EstebanNahuelok/dengue-centinela) es solo una idea previa del equipo, de la que se tomó la inspiración (reportes ciudadanos + clima sobre un mapa) y la elección de tecnologías; no se reutilizó código de ese repositorio.

## Qué hace

- **Mapa de Jujuy** con la RN 9 (San Salvador de Jujuy – Abra Pampa) y la RN 52 (Purmamarca – Salinas Grandes), pintadas tramo por tramo con el color de su estado.
- **Análisis cada 5 km**: las rutas se dividen en 56 tramos de 5 km; cada uno tiene su clima, pronóstico, riesgo, reportes y alertas. Los tramos vecinos con la misma alerta se muestran como una sola.
- **Vista a futuro**: el mapa se puede adelantar 3, 6 o 12 horas para ver el estado previsto de toda la ruta.
- **Clima por tramo**: ícono (sol, nubes, neblina, lluvia, nieve, tormenta, viento), temperatura y **altitud** de cada punto.
- **Estado de cada tramo**: bien, atención o problemas, con el motivo (visibilidad reducida, nevada, ráfagas, hielo, reportes).
- **Clima automático**: una sola consulta a Open-Meteo trae los 56 tramos a la vez y se renueva cada 15 minutos.
- **Dificultades viales sobre el mapa**: cada tramo muestra pictogramas de lo que complica el camino (derrumbe, agua sobre la calzada, barro o piedras, neblina, hielo, corte, baches, obras); al tocarlos se abre la explicación.
- **Modo navegación**: mapa en vivo al estilo Android Auto que sigue tu posición. Arriba muestra la alerta del tramo que estás recorriendo y la próxima dificultad; al costado, una barra con el estado de todo el viaje; abajo, la hora de llegada, el tiempo y los kilómetros que faltan. Desde ahí se abre "Camino por delante", se reporta en el tramo actual y se activan los avisos por voz. Lo que muestra de cada tramo es lo previsto para la hora en que vas a pasar. Incluye dos simulaciones para probarlo sin estar en la ruta: una que recorre el camino con los datos reales y una demo fluida de Maimará a Huacalera con alertas simuladas (agua en la calzada, barro, derrumbe, neblina, obras).
- **Funciona sin señal**: guarda los últimos datos recibidos y, sin conexión, estima el estado de cada tramo con el pronóstico por hora que traían. La aplicación y el mapa ya visto se abren sin conexión.
- **Reportes de la gente** desde la web: neblina, corte de ruta, derrumbe, crecida o agua en la ruta, barro o piedras, hielo, nevada, accidente, baches, obras o desvío, fila. Cada reporte queda en su tramo, expira solo después de unas horas y, si hay 2 o más del mismo tipo en el mismo tramo, se marca como **confirmado**.
- **Texto libre**: si la persona elige "Otra cosa" y escribe qué pasa, Groq clasifica el mensaje (con un clasificador por palabras clave como respaldo).
- **Pronóstico por tramo**: estado previsto hora por hora para las próximas 24 horas, con aviso cuando un tramo va a empeorar ("se espera neblina de 07:00 a 09:00").
- **Riesgo de aludes y crecidas**: índice bajo, moderado o alto según la lluvia caída en 72 horas y la prevista, más exigente en los tramos con antecedentes.
- **Zonas críticas**: sectores de cada tramo con antecedentes de aludes, crecidas o derrumbes, cada uno con su fuente.
- **Alertas dentro de la aplicación**: cualquier reporte activo genera una alerta, esté o no confirmado; lista de alertas vigentes y aviso en pantalla cuando aparece una nueva mientras la aplicación está abierta.
- **Cortes y alternativas**: si hay un corte o derrumbe reportado, el tramo muestra la restricción, el desvío (solo si tiene un antecedente oficial) y el enlace al parte de Vialidad Nacional.
- **Patrones**: resumen de los reportes de los últimos 30 días por tramo (qué se reporta y en qué momento del día).
- **Alertas por WhatsApp**: cada persona elige las localidades, el horario y si quiere enterarse solo de los problemas o también de los estados de atención; el aviso llega cuando aparece una alerta nueva y se puede dar de baja desde el enlace de cada mensaje.
- **Sin conexión**: desde la primera visita quedan guardados la aplicación, el mapa de fondo de toda la ruta y los últimos datos. Sin internet la aplicación abre igual, avisa que no hay datos nuevos y estima el estado con el último pronóstico recibido; cuando vuelve la señal se actualiza sola.
- **Noticias de los diarios**: cada 5 minutos se buscan en Google Noticias las notas sobre incidentes en estas rutas (cortes, derrumbes, accidentes, crecidas) y se muestran con el nombre del medio y el enlace directo a la nota. Son informativas: no cambian el estado de los tramos.
- **Efectos sobre el mapa**: cada zona con dificultades lleva una capa translúcida animada según lo que pasa (nubes para la neblina, lluvia, nieve, viento, hielo, o un pulso para cortes y derrumbes) y una burbuja con el texto; no tapan la ruta ni impiden tocarla.
- **Portada y temas**: una portada que explica la aplicación, un tema claro de tonos cálidos y un tema oscuro; se elige con el botón del encabezado y, si no se eligió, sigue el del teléfono.
- **Pensado para el celular**: se abre en la ruta, sin instalar nada y sin registrarse.

## Localidades de referencia

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

Las localidades están en `backend/src/data/puntos.js`. Los tramos se generan con `node scripts/generar-tramos.mjs`, que escribe `backend/src/data/tramos.json` y `frontend/src/data/tramos-geo.json`; hay que volver a correrlo si cambia el trazado o se suma una localidad.

## Cómo se calcula el estado

| Estado | Por clima | Por reportes |
|---|---|---|
| Problemas | Visibilidad menor a 200 m, lluvia fuerte, nevada fuerte, tormenta o ráfagas de 80 km/h o más | Evento grave confirmado (2 o más reportes iguales) |
| Atención | Neblina, lluvia o llovizna, nevada leve, ráfagas de 50 km/h o más, temperatura bajo cero, riesgo alto de aludes o crecidas | Cualquier reporte activo sin confirmar, o filas |
| Bien | Nada de lo anterior | Sin reportes activos |

Los reportes expiran solos: neblina y filas a las 2 horas, accidentes a las 3, hielo, nevadas, crecidas y barro a las 5, cortes y derrumbes a las 8, obras a las 12 y baches a las 24.

## Cómo se calcula el riesgo de aludes y crecidas

Se suma la lluvia de las últimas 24 horas, la mitad de la de los dos días anteriores y la prevista para las próximas 24 horas (datos de Open-Meteo). En tramos con zonas críticas el riesgo es moderado desde 10 mm y alto desde 25 mm, o si se espera una hora de 10 mm o más; en el resto, desde 25 y 50 mm (o una hora de 20 mm). Los umbrales están en `backend/src/services/riesgo.js` y son orientativos: hay que calibrarlos con el historial de cortes.

Las zonas críticas están en `backend/src/data/zonasCriticas.js` y los desvíos en `backend/src/data/alternativas.js`.

## Stack

- **Backend**: Node.js + Express, Prisma + Postgres (Neon), Groq, Open-Meteo, Twilio (WhatsApp).
- **Frontend**: React + Vite + TypeScript, Tailwind, Leaflet.
- **Deploy**: Render (backend) y Vercel (frontend).
- **Gestor de paquetes**: pnpm.

```
pachamapa/
├── backend/            API Express, Prisma y servicios (clima, reportes, clasificador)
├── frontend/           Aplicación web (mapa, lista de tramos, formulario de reportes)
├── scripts/            Scripts que generan el trazado de las rutas y los tramos de 5 km
├── docker-compose.yml  Postgres local para desarrollo
└── render.yaml         Configuración del backend en Render
```

## Correrlo en local

Requisitos: Node 20 o superior, pnpm y Docker (o una base Postgres propia).

```bash
# 1. Base de datos local (o usar la connection string de Neon en el paso 2)
docker compose up -d

# 2. Backend
cd backend
pnpm install
cp .env.example .env        # DATABASE_URL y, opcional, GROQ_API_KEY
pnpm prisma migrate deploy  # crea las tablas
pnpm dev                    # http://localhost:3001
pnpm test                   # tests del pronóstico, el riesgo y las alertas

# 3. Frontend (en otra terminal)
cd frontend
pnpm install
pnpm dev                    # http://localhost:5173
```

En desarrollo el frontend redirige `/api` al backend local, así que no hace falta configurar nada más.

### Variables de entorno

| Dónde | Variable | Para qué |
|---|---|---|
| backend | `DATABASE_URL` | Connection string de Postgres. Sin base, el mapa y el clima funcionan igual; solo se desactivan los reportes. |
| backend | `GROQ_API_KEY` | Opcional. Clasifica el texto libre de los reportes. |
| backend | `GROQ_MODEL` | Opcional. Modelo de Groq (por defecto `llama-3.1-8b-instant`). |
| backend | `CORS_ORIGIN` | Opcional. Orígenes permitidos separados por coma (vacío = todos). |
| backend | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | Opcional. Credenciales y número de WhatsApp de Twilio. Sin las tres, las alertas no se envían: solo se escriben en el log. |
| backend | `PUBLIC_URL` | Opcional. URL pública del backend, para el enlace de baja (en Render se detecta sola). |
| backend | `FRONTEND_URL` | Opcional. URL del mapa, para incluirla en cada alerta. |
| backend | `ALERTAS_REPETIR_HORAS` | Opcional. Horas antes de repetir un aviso que sigue igual (por defecto 6). |
| backend | `NOTICIAS`, `NOTICIAS_MINUTOS`, `NOTICIAS_HORAS` | Opcional. `NOTICIAS=no` desactiva las noticias; las otras dos cambian cada cuántos minutos se consultan (5) y de cuántas horas para atrás (48). |
| backend | `PORT` | Puerto (por defecto 3001). |
| frontend | `VITE_API_URL` | URL pública del backend. Se lee **al hacer el build**, no después. |

## Deploy

1. **Neon**: crear un proyecto y copiar la connection string directa (no la "pooled").
2. **Render**: New → Blueprint → elegir este repo (usa `render.yaml`) y cargar `DATABASE_URL` y `GROQ_API_KEY`. El build aplica las migraciones solo.
3. **Vercel**: importar el repo con *Root Directory* `frontend` y definir `VITE_API_URL` con la URL de Render antes del primer build.
4. Opcional: en Render, poner en `CORS_ORIGIN` la URL de Vercel.

## API

| Método y ruta | Descripción |
|---|---|
| `GET /api/tramos` | Clima, estado, motivos, reportes activos, pronóstico, riesgo, zonas críticas, restricción e historial de cada tramo, más la lista de alertas. |
| `POST /api/reportes` | Crea un reporte: `{ tipo?, tramoId? , lat?, lon?, comentario? }`. Sin `tipo` se clasifica el comentario; sin `tramoId` se usa el punto más cercano a `lat`/`lon`. |
| `GET /api/reportes` | Reportes activos. |
| `POST /api/visitas` | Registra una visita. |
| `GET /api/metricas` | Visitas, visitantes únicos, reportes y anotados en la lista de espera. |
| `POST /api/lista-espera` | Suma un interesado: `{ nombre, contacto, rubro, mensaje? }`. |
| `POST /api/alertas/suscripciones` | Alta o cambio de una suscripción: `{ telefono, nombre?, tramos?, nivel?, desdeHora?, hastaHora? }`. Los `tramos` son ids de localidad; sin `tramos` se avisa por todo. `nivel` es `problemas` (por defecto) o `atencion`. |
| `GET /api/alertas/baja/:token` | Da de baja una suscripción (es el enlace que viene en cada mensaje). |
| `GET /api/health` | Estado del servicio. |

## Tracción y modelo de negocio

El mapa es gratuito para quien viaja. El plan pago apunta a quienes trabajan en la ruta —agencias de turismo, transportistas y guías— con **alertas por tramo y horario** antes de salir.

Para medirlo desde el primer día, la aplicación registra visitas, visitantes únicos, reportes enviados y anotados en la lista de espera; los números se ven en `GET /api/metricas` y al pie de la lista de tramos.

## Limitaciones conocidas

- La visibilidad de Open-Meteo sale de un modelo, no de una estación en la ruta: sirve como alerta, y por eso se complementa con los reportes de la gente.
- Un reporte se confirma por cantidad de envíos, no por personas distintas; hay un límite de envíos por IP para frenar abusos.
- El riesgo de aludes y crecidas es una estimación por lluvia, no una predicción del evento, y sus umbrales no están calibrados.
- Las zonas críticas salen de noticias y publicaciones, no de un relevamiento oficial; falta validarlas con Vialidad y Defensa Civil.
- Las alertas solo se ven con la aplicación abierta: no hay notificaciones push.
- Sin señal no se pueden enviar reportes, y la estimación solo cubre las 24 horas del último pronóstico recibido.
- El modo navegación calcula las llegadas con la velocidad del GPS o, si no la hay, suponiendo 60 km/h.
- Las dificultades se ubican en su tramo de 5 km, no en el kilómetro exacto. Los kilómetros se cuentan desde San Salvador de Jujuy (RN 9) y desde el empalme (RN 52): no son los mojones oficiales.
- El modelo de clima tiene una resolución de varios kilómetros: dos tramos vecinos suelen diferir por la altitud más que por el clima.
- El mapa de navegación queda siempre con el norte arriba; no gira según el rumbo.
- La API gratuita de Open-Meteo es para uso no comercial y tiene un límite diario de consultas; para el plan pago hay que contratar su API comercial.
- El parte de Vialidad Nacional se enlaza, pero no se lee automáticamente; los cortes salen de los reportes de la gente.
  - Las alertas por WhatsApp se revisan cada vez que se actualiza el clima y al entrar un reporte. En el plan gratuito de Render el backend se duerme sin visitas, y mientras duerme no se envían alertas.
  - Con el sandbox de Twilio, cada número tiene que mandar primero el mensaje de alta del sandbox para poder recibir alertas. No se verifica que el número sea de quien se suscribe.
  - Los reportes se siguen cargando solo desde la web: WhatsApp se usa para avisar, no para reportar.

## Equipo

- Esteban ([@EstebanNahuelok](https://github.com/EstebanNahuelok))

## Créditos

- Datos del clima: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
- Mapa base y trazado de las rutas: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL); el trazado se obtuvo con OSRM.
- Desarrollo asistido con IA (Devin), como figura en los commits.
