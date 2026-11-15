# Pachamapa: estado actual (15/11/2026, 5:30 am)

Rama `damba`. Este documento resume qué hace hoy la aplicación, qué le falta para funcionar por completo y qué conviene mejorar.

## En una frase

Pachamapa analiza la RN 9 (San Salvador de Jujuy – Abra Pampa) y la RN 52 (empalme – Salinas Grandes) en tramos de 5 km, muestra el estado de cada tramo, anticipa cómo va a estar en las próximas horas y avisa de las dificultades viales mientras se maneja.

## Qué hace hoy

### Análisis por tramos de 5 km

- Las rutas están divididas en 56 tramos de 5 km: 43 en la RN 9 y 13 en la RN 52.
- Cada tramo tiene altitud, clima, pronóstico, riesgo, reportes y alertas propios.
- Los tramos se nombran por la localidad que contienen o por las que tienen a los lados ("Entre Tilcara y Huacalera").
- Cada tramo tiene un estado: bien, atención o problemas. Es el peor entre lo que dice el clima, lo que reporta la gente y el riesgo por lluvia.

### Monitoreo

- Clima de cada tramo con datos de Open-Meteo: temperatura, visibilidad, viento, ráfagas, lluvia y nieve. Se renueva cada 15 minutos.
- Del clima se deducen estas dificultades: neblina, visibilidad muy reducida, calzada mojada, lluvia fuerte, tormenta, nevada, viento fuerte y posible hielo.
- El mapa pinta la ruta tramo por tramo con el color de su estado y marca las dificultades con pictogramas. Al tocar un pictograma se abre su explicación.

### Predicción

- Pronóstico hora por hora para las próximas 24 horas en cada tramo, con el estado previsto de cada hora.
- Aviso cuando un tramo va a empeorar ("Previsto de 07:00 a 08:00: visibilidad muy reducida").
- Vista a futuro: el mapa se puede adelantar 3, 6 o 12 horas para ver el estado previsto de toda la ruta.
- Riesgo de aludes y crecidas (bajo, moderado o alto) según la lluvia caída en 72 horas y la prevista para las próximas 24. Es más exigente en los tramos con antecedentes.
- Aviso de temporada: lluvias de noviembre a marzo, nieve y hielo de junio a septiembre.

### Reportes de la gente

- Tipos: neblina, corte de ruta, derrumbe, crecida o agua en la ruta, barro o piedras, hielo, nevada, accidente, baches, obras o desvío, y fila.
- El reporte se asigna al tramo de 5 km elegido o al más cercano a la ubicación del teléfono.
- Cada reporte expira solo, entre 2 y 24 horas según el tipo. Con 2 o más reportes iguales en el mismo tramo queda confirmado.
- Si la persona escribe texto libre, se clasifica con Groq y, si Groq no está, con palabras clave.
- Cualquier reporte activo genera una alerta, esté o no confirmado.
- Un corte o derrumbe reportado muestra la restricción, el enlace al parte de Vialidad Nacional y un desvío, solo en los tramos donde hay un antecedente oficial.

### Alertas

- Lista de alertas vigentes en el panel. Los tramos vecinos con la misma alerta se juntan en una sola ("Volcán – Tumbaya · RN 9 · 35–50 km").
- Aviso en pantalla cuando aparece una alerta nueva con la aplicación abierta.
- Las alertas solo se ven dentro de la aplicación: no hay notificaciones push.

### Navegación

- Mapa en vivo al estilo Android Auto que sigue la posición del GPS.
- Tarjeta superior con la alerta del tramo que se está recorriendo y, debajo, la próxima dificultad con su distancia.
- Barra lateral con el estado de todo el viaje.
- Barra inferior con la hora de llegada, el tiempo y los kilómetros que faltan.
- "Camino por delante": lista del recorrido que agrupa los tramos seguidos con la misma situación.
- Lo que se muestra de cada tramo es lo previsto para la hora en que se va a pasar por ahí, no lo que ocurre ahora.
- Avisos por voz opcionales cuando una dificultad queda a 5 km.
- Botón para reportar en el tramo actual.
- Mapa oscuro de noche y pantalla siempre encendida, si el teléfono lo permite.
- Dos simulaciones: una recorre la ruta con los datos reales; la otra va de Maimará a Huacalera de forma fluida con alertas inventadas.

### Sin señal

- La aplicación guarda la última respuesta del servidor.
- Sin conexión, estima el estado de cada tramo con el pronóstico por hora que traían esos datos y avisa que es una estimación.
- La aplicación y las partes del mapa ya vistas se abren sin conexión (solo en la versión publicada, no en desarrollo).
- Sin señal no se pueden enviar reportes.

### Zonas críticas y patrones

- Once zonas críticas cargadas (aludes, crecidas, derrumbes, neblina, hielo) en ocho localidades. Ocho tienen enlace a su fuente y tres salen del diagnóstico territorial del equipo, sin enlace.
- Resumen de los reportes de los últimos 30 días por tramo: qué se reporta y en qué momento del día.

### Tracción

- Contador de visitas y visitantes únicos, lista de espera para el plan pago (agencias, transportistas, guías) y métricas públicas.

## Qué se probó y qué no

| Parte | Estado |
|---|---|
| Clima, pronóstico, riesgo y alertas con datos reales | Probado en local |
| Mapa, vista a futuro, navegación y las dos simulaciones | Revisado con capturas de pantalla |
| Lógica del backend | 12 tests automáticos, todos pasan |
| Abrir la aplicación con el servidor apagado | Probado antes de dividir en tramos de 5 km; no se repitió después |
| Reportes, confirmación, cortes, historial, métricas, lista de espera | Sin probar en vivo: falta la base de datos |
| GPS real, avisos por voz, pantalla encendida | Sin probar: hay que verlo en un teléfono |
| Globo al tocar un pictograma del mapa | Sin probar |
| Clasificación con Groq | Sin probar: falta la clave |

## Qué necesita para funcionar totalmente

1. **Base de datos Postgres.** Sin ella no funcionan los reportes, la confirmación, los cortes, el historial, las métricas ni la lista de espera. Lo más simple es crear un proyecto gratis en Neon, cargar la connection string en `DATABASE_URL` y correr `corepack pnpm prisma migrate deploy` en `backend`.
2. **Publicarla con HTTPS.** El GPS, el modo sin señal y la pantalla siempre encendida solo funcionan en un sitio con HTTPS (o en `localhost`). En un teléfono, la navegación no anda hasta que esté desplegada. El README describe el despliegue en Render (backend) y Vercel (frontend, con `VITE_API_URL`).
3. **Pasar los cambios a `main`.** Todo lo nuevo está en `damba`. Si Render y Vercel despliegan desde `main`, hay que unir la rama.
4. **Clave de Groq** (`GROQ_API_KEY`). Es opcional: sin ella, el texto libre se clasifica por palabras clave.
5. **Una prueba en la ruta con un teléfono.** Es la única forma de validar el GPS, la voz, el comportamiento sin señal y si los tramos de 5 km se sienten bien manejando.
6. **Licencia de Open-Meteo para el plan pago.** La API gratuita es para uso no comercial y tiene un límite diario de consultas.

## Limitaciones que conviene tener presentes

- La neblina y la visibilidad salen de un modelo meteorológico, no de una estación en la ruta. El modelo tiene una resolución de varios kilómetros, así que dos tramos vecinos difieren más por la altitud que por el clima.
- Un derrumbe o el agua sobre la calzada solo aparecen si alguien los reporta. No hay detección automática.
- Los umbrales del riesgo de aludes y crecidas son un punto de partida y no están calibrados.
- Los kilómetros se cuentan desde San Salvador de Jujuy (RN 9) y desde el empalme (RN 52). No son los mojones oficiales.
- Las llegadas se calculan con la velocidad del GPS o, si no la hay, suponiendo 60 km/h.
- El mapa de navegación queda con el norte arriba: no gira según el rumbo.
- La confirmación de un reporte cuenta envíos, no personas distintas.
- El límite de envíos por IP y el clima guardado viven en la memoria del servidor: se pierden al reiniciarlo.

## Sugerencias para mejorarla

### Primero: lo que la vuelve un producto real

1. **Leer las fuentes oficiales.** La página de estado de rutas de Vialidad Nacional se alimenta de una planilla pública, y la Agencia Provincial de Seguridad Vial publica partes diarios. Incorporarlos daría cortes y restricciones sin depender de que alguien reporte. También las alertas del Servicio Meteorológico Nacional.
2. **Alertas fuera de la aplicación.** Notificaciones push, Telegram o WhatsApp por tramo y horario ("avisame si el tramo Volcán–Tilcara empeora antes de las 7"). Es justo lo que se planea vender a agencias y transportistas.
3. **Ubicación exacta de los reportes.** Guardar la coordenada del reporte y marcarlo en ese punto del mapa, además de sumarlo a su tramo de 5 km.
4. **Preguntar si sigue ahí.** Al pasar por un tramo con un reporte, preguntar "¿sigue el derrumbe?" con dos botones grandes. Mantiene los reportes vivos y saca los viejos antes de que expiren.
5. **Reportes sin señal.** Guardar el reporte en el teléfono y enviarlo solo cuando vuelva la conexión. En esta ruta es donde más hace falta.

### Después: mejor predicción

6. **Calibrar el riesgo con historia real.** Cargar la cronología de incidentes del diagnóstico territorial (fecha, lugar, fenómeno) y compararla con la lluvia de esos días para ajustar los umbrales.
7. **Validar las zonas críticas** con Vialidad y Defensa Civil y ubicarlas en su kilómetro exacto, no en la localidad más cercana.
8. **Sumar más rutas.** El diagnóstico habla de la RN 40, la RN 66 y varias rutas provinciales, y la RN 9 sigue hasta La Quiaca.
9. **Comparar modelos de clima.** Consultar más de un modelo y mostrar cuánto coinciden daría una idea de qué tan confiable es cada pronóstico de neblina.

### Navegación

10. **Mapa que gire con el rumbo** y posición pegada a la ruta. Requiere cambiar la librería de mapas por una que rote, como MapLibre.
11. **Descargar el mapa del recorrido antes de salir**, para que todo el camino se vea sin señal y no solo lo ya visitado.
12. **Instalable en el teléfono.** Agregar el manifiesto de aplicación web para tenerla en la pantalla de inicio y abrirla a pantalla completa.
13. **Resumen antes de salir.** Una pantalla "tu viaje a Humahuaca a las 7:00" con lo previsto en el recorrido y la mejor hora para salir.

### Mantenimiento

14. **Tests del frontend e integración continua.** Hoy solo el backend tiene tests y no hay nada que los corra en cada cambio.
15. **Una sola versión de la lógica compartida.** El armado de alertas está escrito dos veces (servidor y modo sin señal), y los textos de los motivos del clima se usan como clave en el frontend. Si alguien cambia uno y no el otro, se rompe sin avisar.
16. **Proteger las métricas y el contador de visitas**, que hoy son públicos y se pueden inflar.
17. **Borrar los reportes vencidos** con una tarea periódica y llevar el límite de envíos a la base de datos.
