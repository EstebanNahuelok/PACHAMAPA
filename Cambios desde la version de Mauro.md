# Pachamapa: cambios desde la última versión de Mauro

Este documento explica qué cambió entre la última versión de `feat/mauro` (commit `c4ca72e`, 15/11/2026 a las 12:05) y este commit en `damba`. Lo anterior a eso está en `Estado actual 5.30 am.md` y en `Cambios desde el estado actual.md`.

## Resumen

- `damba` ahora contiene todo lo de `feat/mauro` más los cambios de este documento.
- Lo nuevo: base de datos funcionando, reportes en un punto exacto de la ruta (con inicio y fin para obras, filas y cortes), sección de emergencia, consejos de manejo, un modo de prueba con rutas en Salta capital y la configuración para abrir la aplicación desde un túnel.
- Son 36 archivos: 29 modificados y 7 nuevos, además de dos migraciones de base de datos.

## 1. Base de datos en marcha

- La base Postgres está creada en Neon y tiene aplicadas todas las migraciones, incluidas las dos de WhatsApp de Mauro y las dos nuevas de este commit.
- La connection string está solo en `backend/.env`, que git ignora. Quien clone el repo tiene que crear su propio `.env`.
- Con la base funcionando se probaron de punta a punta los reportes, la confirmación, las alertas, el historial, la lista de espera, las visitas, las métricas y la suscripción por WhatsApp (sin Twilio, el mensaje se escribe en el log).

## 2. Reportes en un punto exacto

Antes un reporte pertenecía a un tramo de 5 km y lo pintaba entero. Ahora:

- **Se elige el lugar.** Al tocar "+ Reportar" el mapa pide tocar el punto exacto de la ruta, o usar "Estoy acá" con el GPS. El punto se lleva al lugar más cercano del trazado; a más de 1,5 km de la ruta no se acepta. El formulario ya no tiene selector de tramo.
- **Se marca solo ese lugar.** Cada reporte aparece como un pictograma en su punto y pinta unos 500 metros de ruta alrededor. El color de la línea del tramo sale solo del clima y del riesgo por lluvia.
- **Inicio y fin.** Las obras, las filas y los cortes pueden llevar un segundo punto, donde terminan, y se pinta el trecho entre los dos. El final tiene que estar sobre la misma ruta, a menos de 15 km del inicio.
- **Confirmación por cercanía.** Dos reportes del mismo tipo a menos de 1 km entre sí son el mismo hecho y lo confirman. Dos derrumbes a 3 km dentro del mismo tramo son dos hechos separados.
- **En la navegación.** El botón "+" reporta en la posición actual. La tarjeta mide la distancia hasta el punto del reporte ("En 2,5 km · Derrumbe") y deja de avisar cuando el punto ya quedó atrás.
- **Lo que no cambió.** Las alertas, la lista y el detalle del tramo siguen contando todos los reportes: un derrumbe confirmado sigue generando la alerta de su tramo. Los reportes anteriores, sin coordenada, siguen pintando su tramo entero.

En la base: la tabla `reportes` suma `lat`, `lon`, `lat_fin` y `lon_fin` (migraciones `20261115180000_reportes_con_punto` y `20261115190000_reportes_con_final`). En la API, cada grupo de reportes de un tramo trae `puntos`, y cada tramo trae `estadoLinea` además de `estado`.

## 3. Emergencia (SOS)

Es la primera de las tres funciones que `context.md` dejaba planificadas, con un alcance más chico que el descripto ahí: no clasifica por tipo de emergencia ni tiene contactos por localidad.

- **Dónde:** botón rojo "SOS" en el mapa y dentro de la navegación.
- **Contacto propio:** nombre y teléfono, guardados solo en ese teléfono. Tiene dos botones: llamar, y enviar la ubicación por WhatsApp con un mensaje ya escrito.
- **Números oficiales con botón de llamar:** 911, 107 (SAME), 100 (Bomberos), 103 (Defensa Civil) y 0800-222-6272 (Vialidad Nacional). Cada uno muestra el enlace a la página oficial de donde sale.
- **Ubicación para decir por teléfono:** ruta, kilómetro y coordenadas, con un botón para copiarlas.
- **Sin datos:** la pantalla y las llamadas funcionan sin internet. Enviar la ubicación por WhatsApp necesita conexión.

## 4. Consejos de manejo

Cubre parte de la segunda función planificada en `context.md` ("recomendaciones antes de salir"). No incluye la lista de control con casillas guardadas.

- **Antes de salir:** al tocar "Navegar" aparece primero una pantalla con cuatro consejos fijos (cinturón, luces bajas, teléfono en el soporte, y combustible, agua y abrigo) y el botón "Arrancar".
- **Según el viaje:** debajo aparecen solo las guías que aplican al recorrido, con el lugar donde empiezan. Hay siete: niebla, lluvia, hielo o nieve, viento fuerte, derrumbes o agua en la calzada, cuesta o camino de cornisa, y altura.
- **Cuesta y altura:** un tramo cuenta como cuesta si tiene más de 200 metros de desnivel con el tramo vecino; la guía de altura aparece desde los 3.000 m.
- **Mientras se maneja:** debajo de la tarjeta del tramo va una línea con el consejo del momento, y el aviso por voz dice qué hay y qué hacer.
- **Avisar que salís:** con un contacto de emergencia cargado, la pantalla previa ofrece mandarle el destino y la hora estimada de llegada.

## 5. Test en Salta

Sirve para desarrollar con GPS real desde Salta capital. No es parte del producto.

- **Dos rutas de prueba, con clima real:** Cerrillos – Vaqueros (27 km, pasando por la plaza 9 de Julio) e Hiper Libertad – San Luis (10 km). Son 7 tramos de 5 km.
- **Cómo se activa:** abriendo la aplicación con `?prueba=salta`, o eligiendo "TEST EN SALTA (GPS real)" en "Desde" dentro de la navegación. Queda guardado en el teléfono hasta salir del test.
- **Aislado del resto:** los tramos de Salta solo llegan con `GET /api/tramos?prueba=salta`, no generan alertas por WhatsApp y no están unidos entre sí ni con las rutas de Jujuy.
- **Destino por defecto:** la otra punta de la ruta de prueba en la que se está.

## 6. Túnel para probar en el teléfono

- `frontend/vite.config.ts` acepta pedidos que llegan por un túnel de Cloudflare (`.trycloudflare.com`), tanto en desarrollo como en la versión de publicación.
- Para levantarlo: `corepack pnpm build` y `corepack pnpm exec vite preview --port 4173` en `frontend`, el backend corriendo, y `cloudflared tunnel --url http://localhost:4173`. La dirección es temporal y cambia cada vez.

## 7. Otros cambios

- **Huacalera** ya figuraba como localidad; las localidades de prueba de Salta se suman aparte, en `PUNTOS_PRUEBA`.
- **Scripts:** `generar-rutas.mjs` puede generar solo las rutas que se le piden, y `generar-tramos.mjs` acepta rutas de prueba.
- **Tests:** el backend pasó de 15 a 18. Los nuevos cubren los tramos de prueba, la confirmación por cercanía y que un reporte con punto no pinta todo el tramo.
- **README y AGENTS.md** actualizados con todo lo anterior.

## Qué se probó y qué no

| Parte | Estado |
|---|---|
| Tests del backend | 18 de 18 pasan |
| Build y lint del frontend | Compila; queda la advertencia ya conocida de `App.tsx` |
| Reportes con punto, con final y confirmación por cercanía | Probado en vivo contra la base |
| Mapa con las rutas de Salta, navegación en Salta, pantalla de emergencia, pantalla "Antes de salir" | Revisado con capturas de pantalla |
| Acceso por el túnel | La página y los datos responden |
| GPS real, elegir el punto tocando el mapa, marcar el final con un segundo toque | Sin probar: hay que verlo en un teléfono |
| Guardar el contacto, llamadas, envío por WhatsApp, consejo por voz | Sin probar |

## Pendientes y cosas a saber

1. **Datos de prueba en la base.** Hay 11 reportes marcados "PRUEBA" en Jujuy (Tilcara, Volcán y entre Tilcara y Huacalera), un anotado en la lista de espera ("PRUEBA Devin") y una visita. Conviene borrarlos antes de mostrar la aplicación.
2. **La contraseña de la base pasó por un chat.** Si preocupa, se puede cambiar desde Neon y actualizar `backend/.env`.
3. **Los consejos de manejo son recomendaciones generales**, no un texto oficial. Conviene que alguien de Vialidad o de Seguridad Vial los revise.
4. **La regla de cuesta (200 m de desnivel) es una aproximación** y puede equivocarse en algún tramo.
5. **Sigue pendiente de la versión de Mauro:** las horas del mensaje de WhatsApp salen sin formato (en UTC), faltan las credenciales de Twilio, y una suscripción hecha con ids de tramo en vez de localidades no recibe avisos.
6. **De `context.md` falta** el asistente con IA, la clasificación por tipo de emergencia con contactos por localidad y la lista de control antes de salir.
7. **Un reporte hecho desde Salta** se asigna a la ruta de prueba más cercana y solo se ve con el test activado.
