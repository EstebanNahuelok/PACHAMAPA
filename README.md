# pachamapa

**Clima y estado de la ruta en Jujuy, tramo por tramo.**

En la Quebrada de Humahuaca el clima cambia en pocos kilómetros: puede estar despejado en Tilcara y haber neblina cerrada en Volcán. Pachamapa muestra en un solo mapa qué pasa en cada tramo de la ruta, combinando el clima automático con los reportes de la gente que está viajando.

> **Sobre este proyecto.** Pachamapa se construyó íntegramente durante el Pre-Hackatón Tren Solar (jujuy.dev), el 15 de noviembre de 2026: todo el código de este repositorio se escribió desde cero ese día, como muestra el historial de commits. [Dengue Centinela](https://github.com/EstebanNahuelok/dengue-centinela) es solo una idea previa del equipo, de la que se tomó la inspiración (reportes ciudadanos + clima sobre un mapa) y la elección de tecnologías; no se reutilizó código de ese repositorio.

## Qué hace

- **Mapa de Jujuy** con la RN 9 (San Salvador de Jujuy – Abra Pampa) y la RN 52 (Purmamarca – Salinas Grandes) dibujadas.
- **Clima por tramo**: ícono (sol, nubes, neblina, lluvia, nieve, tormenta, viento), temperatura y **altitud** de cada punto.
- **Estado de cada tramo**: bien, atención o problemas, con el motivo (visibilidad reducida, nevada, ráfagas, hielo, reportes).
- **Clima automático**: una sola consulta a Open-Meteo trae los 11 puntos a la vez y se renueva cada 5 minutos.
- **Reportes de la gente** desde la web: neblina, corte de ruta, derrumbe, hielo, nevada, accidente, fila. Cada reporte queda en su tramo, expira solo después de unas horas y, si hay 2 o más del mismo tipo en el mismo tramo, se marca como **confirmado**.
- **Texto libre**: si la persona elige "Otra cosa" y escribe qué pasa, Groq clasifica el mensaje (con un clasificador por palabras clave como respaldo).
- **Alertas por WhatsApp**: cada persona elige sus tramos, el horario y si quiere enterarse solo de los problemas o también de los estados de atención; el aviso llega cuando el tramo cambia y se puede dar de baja desde el enlace de cada mensaje.
- **Pensado para el celular**: se abre en la ruta, sin instalar nada y sin registrarse.

## Puntos cubiertos

| Tramo | Ruta | Altitud |
|---|---|---|
| San Salvador de Jujuy | RN 9 | 1.259 m |
| Volcán | RN 9 | 2.084 m |
| Tumbaya | RN 9 | 2.094 m |
| Purmamarca | RN 9 | 2.324 m |
| Maimará | RN 9 | 2.334 m |
| Tilcara | RN 9 | 2.465 m |
| Uquía | RN 9 | 2.818 m |
| Humahuaca | RN 9 | 2.939 m |
| Abra Pampa | RN 9 | 3.484 m |
| Cuesta de Lipán | RN 52 | 4.170 m |
| Salinas Grandes | RN 52 | 3.450 m |

Las coordenadas y altitudes son aproximadas y están en `backend/src/data/puntos.js`. Sumar un punto es agregar una línea a ese archivo.

## Cómo se calcula el estado

| Estado | Por clima | Por reportes |
|---|---|---|
| Problemas | Visibilidad menor a 200 m, lluvia fuerte, nevada fuerte, tormenta o ráfagas de 80 km/h o más | Evento grave confirmado (2 o más reportes iguales) |
| Atención | Neblina, lluvia o llovizna, nevada leve, ráfagas de 50 km/h o más, temperatura bajo cero | Cualquier reporte activo sin confirmar, o filas |
| Bien | Nada de lo anterior | Sin reportes activos |

Los reportes expiran solos: neblina y filas a las 2 horas, accidentes a las 3, hielo y nevadas a las 5, cortes y derrumbes a las 8.

## Stack

- **Backend**: Node.js + Express, Prisma + Postgres (Neon), Groq, Open-Meteo, Twilio (WhatsApp).
- **Frontend**: React + Vite + TypeScript, Tailwind, Leaflet.
- **Deploy**: Render (backend) y Vercel (frontend).
- **Gestor de paquetes**: pnpm.

```
pachamapa/
├── backend/            API Express, Prisma y servicios (clima, reportes, clasificador)
├── frontend/           Aplicación web (mapa, lista de tramos, formulario de reportes)
├── scripts/            Script que generó el trazado de las rutas
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
| backend | `ALERTAS_REPETIR_HORAS` | Opcional. Horas antes de repetir el aviso de un tramo que sigue igual (por defecto 6). |
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
| `GET /api/tramos` | Clima, estado, motivos y reportes activos de cada tramo. |
| `POST /api/reportes` | Crea un reporte: `{ tipo?, tramoId? , lat?, lon?, comentario? }`. Sin `tipo` se clasifica el comentario; sin `tramoId` se usa el punto más cercano a `lat`/`lon`. |
| `GET /api/reportes` | Reportes activos. |
| `POST /api/visitas` | Registra una visita. |
| `GET /api/metricas` | Visitas, visitantes únicos, reportes y anotados en la lista de espera. |
| `POST /api/lista-espera` | Suma un interesado: `{ nombre, contacto, rubro, mensaje? }`. |
| `POST /api/alertas/suscripciones` | Alta o cambio de una suscripción: `{ telefono, nombre?, tramos?, nivel?, desdeHora?, hastaHora? }`. Sin `tramos` se avisa por todos; `nivel` es `problemas` (por defecto) o `atencion`. |
| `GET /api/alertas/baja/:token` | Da de baja una suscripción (es el enlace que viene en cada mensaje). |
| `GET /api/health` | Estado del servicio. |

## Tracción y modelo de negocio

El mapa es gratuito para quien viaja. El plan pago apunta a quienes trabajan en la ruta —agencias de turismo, transportistas y guías— con **alertas por tramo y horario** antes de salir.

Para medirlo desde el primer día, la aplicación registra visitas, visitantes únicos, reportes enviados y anotados en la lista de espera; los números se ven en `GET /api/metricas` y al pie de la lista de tramos.

## Limitaciones conocidas

- La visibilidad de Open-Meteo sale de un modelo, no de una estación en la ruta: sirve como alerta, y por eso se complementa con los reportes de la gente.
- Un reporte se confirma por cantidad de envíos, no por personas distintas; hay un límite de envíos por IP para frenar abusos.
- Las alertas se revisan cada 5 minutos y al entrar un reporte. En el plan gratuito de Render el backend se duerme sin visitas, y mientras duerme no se envían alertas.
- Con el sandbox de Twilio, cada número tiene que mandar primero el mensaje de alta del sandbox para poder recibir alertas. No se verifica que el número sea de quien se suscribe.
- Los reportes se siguen cargando solo desde la web: WhatsApp se usa para avisar, no para reportar.

## Equipo

- Esteban ([@EstebanNahuelok](https://github.com/EstebanNahuelok))

## Créditos

- Datos del clima: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
- Mapa base y trazado de las rutas: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL); el trazado se obtuvo con OSRM.
- Desarrollo asistido con IA (Devin), como figura en los commits.
