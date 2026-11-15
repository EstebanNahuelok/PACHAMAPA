// Sectores con antecedentes de cortes por aludes, crecidas o derrumbes. Cada zona cita el antecedente del que sale.
// Las zonas sin enlace (fuente: null) salen del diagnostico territorial del equipo y falta respaldarlas con una fuente.
// Es un punto de partida a validar con Vialidad y Defensa Civil: sumar una zona es agregar una linea.
export const ZONAS_CRITICAS = {
  volcan: [
    { tipo: 'niebla', lugar: 'León – Bárcena – Volcán', detalle: 'Neblina baja frecuente de madrugada, con visibilidad casi nula en algunos partes de tránsito.', fuente: null },
    { tipo: 'alud', lugar: 'Arroyo del Medio (Volcán – Bárcena)', detalle: 'Alud de barro y piedras del 10/01/2017: cortó la RN 9 varios días y volvió a taparla con cada lluvia fuerte.', fuente: 'https://www.lanacion.com.ar/sociedad/alud-en-jujuy-dos-muertos-en-la-localidad-de-volcan-nid1974677/' },
  ],
  tumbaya: [
    { tipo: 'niebla', lugar: 'Bárcena – Tumbaya', detalle: 'Neblina baja frecuente de madrugada.', fuente: null },
    { tipo: 'crecida', lugar: 'Tumbaya Grande y Arroyo Molle', detalle: 'Cortes totales de la RN 9 por crecida del río y arroyos durante temporales de verano.', fuente: 'https://www.clarin.com/sociedad/temporal-jujuy-cortes-ruta-alud-crecida-arroyos_0_9Zom49klC.html' },
  ],
  purmamarca: [
    { tipo: 'derrumbe', lugar: 'Paraje Chañarcito', detalle: 'Desmoronamiento del cerro sobre la RN 9 durante un temporal.', fuente: 'https://www.clarin.com/sociedad/temporal-jujuy-cortes-ruta-alud-crecida-arroyos_0_9Zom49klC.html' },
  ],
  maimara: [
    { tipo: 'crecida', lugar: 'Arroyo Las Peras (Maimará – Tilcara)', detalle: 'Corte de la RN 9 por crecida tras una lluvia corta e intensa (diciembre de 2018).', fuente: 'https://www.jujuyalmomento.com/intensa-lluvia/temporal-la-quebrada-varios-puntos-afectados-n76324' },
  ],
  tilcara: [
    { tipo: 'crecida', lugar: 'Río Huasamayo y Huichaira', detalle: 'Crecidas súbitas con gran arrastre de sedimento; anegamientos de la RN 9 al norte de Tilcara.', fuente: 'https://www.mdpi.com/2076-3263/9/11/483' },
  ],
  uquia: [
    { tipo: 'crecida', lugar: 'Chucalezna', detalle: 'Media calzada por arrastre de barro tras lluvias persistentes (enero de 2023).', fuente: null },
  ],
  humahuaca: [
    { tipo: 'crecida', lugar: 'Puente Soledad', detalle: 'Acumulación de piedra y barro en el badén por crecida de arroyos.', fuente: 'https://www.clarin.com/sociedad/temporal-jujuy-cortes-ruta-alud-crecida-arroyos_0_9Zom49klC.html' },
  ],
  'cuesta-de-lipan': [
    { tipo: 'hielo', lugar: 'Subida desde Purmamarca', detalle: 'Restricciones al transporte de carga por nieve y hielo en invierno (agosto de 2026).', fuente: 'https://jujuyonlinenoticias.com.ar/restriccion-en-la-ruta-52-y-cierre-del-paso-de-jama-por-nieve/' },
    { tipo: 'derrumbe', lugar: 'Ronqui Angosto (km 46 de la RN 52)', detalle: 'Corte total por deslizamiento de tierra tras lluvia torrencial con granizo (01/04/2026).', fuente: 'https://www.somosjujuy.com.ar/jujuy/corte-total-ruta-nacional-52-derrumbe-cuesta-lipan-n115881' },
  ],
};

const SENSIBLES_A_LLUVIA = ['alud', 'crecida', 'derrumbe'];
export const zonasDe = (tramoId) => ZONAS_CRITICAS[tramoId] ?? [];
export const esSensibleALluvia = (zonas) => zonas.some((z) => SENSIBLES_A_LLUVIA.includes(z.tipo));
