// Indice de riesgo de aludes, crecidas y derrumbes por lluvia. No predice el evento: avisa cuando la lluvia
// caida y la prevista hacen mas probable un problema, sobre todo en tramos con antecedentes.
// Los umbrales (mm) son orientativos y hay que calibrarlos con el historial de cortes.
const UMBRALES = {
  sensible: { moderado: 10, alto: 25, picoAlto: 10 },
  comun: { moderado: 25, alto: 50, picoAlto: 20 },
};

const mesLocal = new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: 'America/Argentina/Jujuy' });

// Estacionalidad segun el diagnostico territorial del equipo: lluvias de noviembre a marzo, nieve y hielo en altura de junio a septiembre.
export function temporadaDe(fecha = new Date()) {
  const mes = Number(mesLocal.format(fecha));
  if (mes >= 11 || mes <= 3) return { id: 'lluvias', nombre: 'Temporada de lluvias', detalle: 'De noviembre a marzo cae la mayor parte de la lluvia del año: son los meses con más crecidas, aludes y barro sobre la ruta.' };
  if (mes >= 6 && mes <= 9) return { id: 'invierno', nombre: 'Temporada invernal', detalle: 'De junio a septiembre son habituales la nieve y el hielo en altura (RN 52) y la neblina de madrugada en la Quebrada.' };
  return null;
}

const suma = (horas) => horas.reduce((total, h) => total + (h.precipitacion ?? 0), 0);
const redondear = (mm) => Math.round(mm * 10) / 10;

export function riesgoPorLluvia({ pasadas = [], futuras = [] } = {}, sensible = false) {
  const lluvia24 = suma(pasadas.slice(-24));
  const lluvia72 = suma(pasadas);
  const prevista24 = suma(futuras);
  const pico = futuras.reduce((max, h) => Math.max(max, h.precipitacion ?? 0), 0);
  // La lluvia de los dias anteriores pesa la mitad: el suelo ya esta cargado pero drena.
  const carga = lluvia24 + (lluvia72 - lluvia24) / 2 + prevista24;
  const u = sensible ? UMBRALES.sensible : UMBRALES.comun;
  const nivel = carga >= u.alto || pico >= u.picoAlto ? 'alto' : carga >= u.moderado ? 'moderado' : 'bajo';
  return { nivel, sensible, lluvia24: redondear(lluvia24), lluvia72: redondear(lluvia72), prevista24: redondear(prevista24), pico: redondear(pico) };
}
