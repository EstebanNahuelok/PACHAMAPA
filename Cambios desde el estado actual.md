# Pachamapa: cambios desde el "Estado actual 5.30 am"

Rama local `merge`, creada a partir de `origin/feat/mauro` (commit `c4ca72e`). Este documento explica qué cambió entre el documento `Estado actual 5.30 am.md` (commit `9104dec`, 15/11/2026 a las 5:32) y la punta de la rama de Mauro (12:05 del mismo día).

## Resumen

- `feat/mauro` parte exactamente del documento de estado: contiene todo lo de `damba` y le suma 10 commits de Mauro Gomez, hechos entre las 10:20 y las 12:05.
- Son 53 archivos tocados, con unas 1.850 líneas agregadas y 76 quitadas.
- Lo nuevo, en orden de peso: alertas por WhatsApp, noticias de los diarios, portada, tema claro y oscuro, efectos sobre el mapa, mejoras del modo sin conexión, identidad de marca y un documento de contexto (`context.md`) con tres funciones planificadas.
- La rama no tiene conflictos con `damba`: es `damba` más los commits de Mauro.

## Ramas del repositorio

| Rama | Último commit | Qué es |
|---|---|---|
| `main` | `0bcbb18` (3:31) | La versión del hackatón, anterior a todo lo de `damba` |
| `damba` | `9104dec` (5:32) | Tramos de 5 km, predicción, navegación y el documento de estado |
| `feat/mauro` | `c4ca72e` (12:05) | `damba` más los 10 commits de Mauro |
| `merge` (solo local) | `c4ca72e` más este documento | Copia de `feat/mauro` para revisar |

## Los 10 commits

| Hora | Commit | Qué hizo |
|---|---|---|
| 10:20 | `35895c8` | Alertas por WhatsApp: suscripción por tramo y horario, envío con Twilio y baja por enlace |
| 10:31 | `cfb9bb5` | Unión con `damba`: tramos de 5 km, predicción y navegación junto con las alertas por WhatsApp |
| 10:39 | `4cf792c` | Portada, tema claro más suave y tema oscuro |
| 10:45 | `66dae1b` | Portada con profundidad 3D en CSS: cerros en capas, tablero flotante y tarjetas que se inclinan |
| 10:56 | `02aa683` | Efectos translúcidos sobre el mapa según la dificultad, con burbuja de texto |
| 11:07 | `19379c8` | Noticias de los diarios sobre las rutas, con fuente y enlace directo |
| 11:14 | `29ea24e` | Sin conexión: la aplicación y el mapa de la ruta quedan guardados desde la primera visita |
| 11:32 | `7595a31` | Panel con tarjetas agrupadas y mapa oscuro más claro |
| 12:00 | `95fa52f` | Identidad de marca: logo, íconos de la aplicación y tipografía Pachamapa Sans |
| 12:05 | `c4ca72e` | `context.md`: estado de la rama y guía para emergencias, recomendaciones y asistente |

## Qué hay de nuevo

### 1. Alertas por WhatsApp

Es el avance más importante. En el documento de estado figuraba como la sugerencia número 2 ("alertas fuera de la aplicación") y como limitación ("no hay notificaciones push").

- **Suscripción:** la persona deja su WhatsApp y elige localidades, franja horaria y nivel mínimo (solo problemas, o también atención). Formulario en `frontend/src/components/AlertasWhatsApp.tsx`.
- **Envío:** cada vez que se actualiza el clima (cada 15 minutos) o entra un reporte, el servidor revisa las alertas y le escribe a cada suscriptor las que le corresponden.
- **Sin repetir:** la misma alerta no se vuelve a mandar hasta pasadas 6 horas, salvo que cambie o empeore.
- **Cobertura:** elegir una localidad cubre también el tramo de 5 km anterior y el siguiente.
- **Baja:** cada mensaje trae un enlace para dejar de recibir alertas.
- **Teléfonos:** se normalizan al formato internacional argentino (acepta "388 15 4123456", "0388...", "+54...").
- **Límite:** 5 altas por hora por IP, porque cada alta manda un mensaje de confirmación.
- **Base de datos:** dos tablas nuevas, `suscripciones` y `alertas_enviadas`, con su migración.
- **API:** `POST /api/alertas/suscripciones` y `GET /api/alertas/baja/:token`. Las métricas suman la cantidad de suscriptores.

Archivos: `backend/src/services/whatsappAlertas.js`, `backend/src/services/whatsapp.js`, `backend/src/routes/alertas.js`.

### 2. Noticias de los diarios

Responde en parte a la sugerencia número 1 ("leer las fuentes oficiales"), aunque usa diarios y no los partes oficiales.

- El servidor busca cada 5 minutos en Google Noticias notas de las últimas 48 horas sobre la RN 9, la RN 52 y la Quebrada.
- Se queda solo con las que hablan de un incidente en las rutas cubiertas, les asigna un tipo (accidente, corte, crecida, etc.) y una localidad si el titular la nombra. También detecta las de "tránsito normalizado".
- Muestra hasta 12, con el nombre del diario y el enlace directo a la nota.
- Llegan dentro de `GET /api/tramos`, así que también quedan guardadas para verlas sin conexión.
- Son informativas: no cambian el estado de los tramos ni disparan alertas.

Archivos: `backend/src/services/noticias.js`, `frontend/src/components/Noticias.tsx`, `backend/test/noticias.test.js`.

### 3. Portada

- Una página de presentación con efectos de profundidad hechos en CSS: cerros en capas, un tablero flotante y tarjetas que se inclinan.
- Se muestra la primera vez; quien ya entró al mapa vuelve directo a él. Se puede forzar con `#inicio` o `#mapa` en la dirección.

Archivos: `frontend/src/components/Portada.tsx`, `frontend/src/Raiz.tsx`.

### 4. Tema claro y oscuro

- Botón para cambiar de tema. Sin elección, usa el del teléfono; la elección se guarda.
- Los colores se cambian desde `index.css`, de modo que los componentes existentes funcionan en los dos temas sin tocarlos.
- El mapa oscuro quedó más claro que el anterior.

Archivos: `frontend/src/lib/tema.ts`, `frontend/src/components/BotonTema.tsx`, `frontend/src/index.css` (más de 300 líneas nuevas).

### 5. Efectos sobre el mapa

- Cada grupo de tramos seguidos con la misma dificultad se dibuja como una zona translúcida animada (por ejemplo, niebla o lluvia) con una burbuja de texto que dice qué pasa y dónde.
- No tapan la ruta ni reciben toques.

Archivos: `frontend/src/lib/efectosMapa.ts`, `frontend/src/components/Mapa.tsx`.

### 6. Sin conexión, mejorado

En el documento de estado, la aplicación solo guardaba lo ya visto. Ahora:

- **La aplicación:** al instalarse, el service worker guarda la página y todos sus archivos, así abre sin conexión desde la segunda visita aunque en la primera no se haya recorrido nada.
- **El mapa:** se descargan de antemano unas 80 teselas de toda la ruta (niveles de zoom 8 a 11), de a 4 por vez, una vez por semana y nunca con el ahorro de datos activado. Es la sugerencia número 11 del documento de estado.

Archivos: `frontend/public/sw.js`, `frontend/src/lib/offline.ts`.

### 7. Panel y marca

- El panel lateral pasó a tarjetas agrupadas.
- Logo nuevo, íconos de la aplicación en varios tamaños, tipografía propia (Pachamapa Sans) y manifiesto de aplicación web (`site.webmanifest`). Con el manifiesto la aplicación se puede instalar en la pantalla de inicio: era la sugerencia número 12.

### 8. Orden interno

- `calcularTramos()` (en `backend/src/services/tramos.js`) junta clima, reportes e historial en un solo lugar. Lo usan la API y las alertas por WhatsApp.
- `clasificarPorPalabras()` separa el clasificador sin IA para usarlo con los titulares.
- `render.yaml` y `.env.example` suman las variables de Twilio, noticias y direcciones públicas.

### 9. `context.md`

Un documento de Mauro para seguir el desarrollo. Resume la rama y describe tres funciones que todavía no están hechas:

1. **A quién llamar en una emergencia**, según el tipo y la ubicación, funcionando sin datos.
2. **Recomendaciones antes de salir**, armadas con el estado del recorrido más una lista de control.
3. **Asistente con IA** para explicar la aplicación y responder sobre el estado de la ruta.

Sugiere hacerlas en ese orden.

## Cómo quedan las sugerencias del documento de estado

| Sugerencia | Estado en `feat/mauro` |
|---|---|
| 1. Leer las fuentes oficiales | Parcial: hay noticias de diarios, no los partes de Vialidad ni de Seguridad Vial |
| 2. Alertas fuera de la aplicación | Hecho por WhatsApp; falta configurar Twilio |
| 11. Descargar el mapa antes de salir | Hecho para los niveles de zoom 8 a 11 |
| 12. Instalable en el teléfono | Hecho (manifiesto e íconos) |
| 3 a 10 y 13 a 17 | Sin cambios |

De "qué necesita para funcionar totalmente" no cambió nada: siguen faltando la base de datos, la publicación con HTTPS, pasar los cambios a `main` y la prueba en ruta. Se suma un requisito nuevo, las credenciales de Twilio.

## Qué verifiqué en la rama `merge`

| Prueba | Resultado |
|---|---|
| Tests del backend | 15 de 15 pasan (antes eran 12; los 3 nuevos son de noticias) |
| Lint del frontend | Solo la advertencia ya conocida de `App.tsx` |
| Build del frontend | Compila; el JS pasó de 473 KB a 501 KB y Vite avisa que supera los 500 KB |
| Arranque del backend | Arranca y responde los 56 tramos |
| Noticias en vivo | Llegaron 3 notas reales (Todo Jujuy, El Tribuno, Qué Pasa Jujuy) con enlace directo al diario |
| Suscripción por WhatsApp | Responde 503 sin base de datos, como está previsto |

No probé la portada, los temas, los efectos del mapa ni el formulario de WhatsApp en el navegador, ni el envío real de mensajes.

## Observaciones

1. **Las horas en el mensaje de WhatsApp salen sin formato.** `textoAlerta` en `whatsappAlertas.js` escribe `a.desde` y `a.hasta` tal cual, y esos campos son fechas ISO. El mensaje quedaría "Previsto: de 2026-11-15T09:00:00.000Z a ...", en hora UTC. Conviene pasarlas a hora de Jujuy antes de mandarlas.
2. **Las alertas por WhatsApp necesitan tres cosas** para llegar de verdad: la base de datos con la migración nueva aplicada, las credenciales de Twilio y, para escribirle a números que no se sumaron al entorno de pruebas de Twilio, un número de WhatsApp aprobado. Sin credenciales, los mensajes solo se escriben en el log.
3. **En el plan gratuito de Render el servidor se duerme** sin visitas, y dormido no manda alertas ni busca noticias. Para un servicio de alertas hace falta que esté siempre encendido.
4. **El enlace directo de las noticias usa un mecanismo interno de Google**, no una API pública. Si Google lo cambia, queda el enlace de Google, que igual redirige al diario. Buscar cada 5 minutos también puede terminar en un bloqueo.
5. **Las noticias se ubican por el titular.** Una nota que no nombra la localidad queda sin ubicar, y la clasificación por palabras puede equivocarse.
6. **La descarga del mapa** pide unas 80 teselas a los servidores de OpenStreetMap por cada teléfono, una vez por semana. Es poco, pero su política de uso desaconseja la descarga masiva; si la aplicación crece conviene un proveedor de teselas propio.
7. **Los números de emergencia de `context.md`** están marcados por el propio documento como "a verificar contra una fuente oficial de Jujuy". No hay que publicarlos sin esa verificación.
8. **`context.md` dice que la rama "parte de `main`".** En la práctica parte de `damba`, que es lo que importa al unir.

## Para unir las ramas

Como `feat/mauro` ya contiene a `damba`, unirla a `damba` o a `main` es un avance directo, sin conflictos. Antes de publicar hay que aplicar la migración nueva (`corepack pnpm prisma migrate deploy` en `backend`) y volver a generar el cliente de Prisma (`corepack pnpm exec prisma generate`).
