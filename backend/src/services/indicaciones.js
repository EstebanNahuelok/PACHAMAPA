// Pasa las maniobras de OSRM a indicaciones en castellano rioplatense, como las de un navegador.
const LADO = {
  right: 'a la derecha',
  left: 'a la izquierda',
  'slight right': 'levemente a la derecha',
  'slight left': 'levemente a la izquierda',
  'sharp right': 'cerrado a la derecha',
  'sharp left': 'cerrado a la izquierda',
  straight: 'derecho',
  uturn: 'en U',
};
const ORDINAL = ['', 'primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima', 'octava'];
const PUNTOS = ['el norte', 'el noreste', 'el este', 'el sureste', 'el sur', 'el suroeste', 'el oeste', 'el noroeste'];

// "RN 9 (Avenida X)" si tiene numero de ruta; si no, el nombre de la calle.
export function via(paso) {
  const ref = (paso.ref ?? '').split(';')[0].trim();
  const nombre = (paso.name ?? '').trim();
  if (ref && nombre && !nombre.includes(ref)) return `${ref} (${nombre})`;
  return ref || nombre;
}

const por = (v) => (v ? ` por ${v}` : '');

export function textoManiobra(paso) {
  const { type, modifier, exit, bearing_after: rumbo } = paso.maneuver;
  const v = via(paso);
  const lado = LADO[modifier] ?? '';
  switch (type) {
    case 'depart':
      return `Salí hacia ${PUNTOS[Math.round((rumbo ?? 0) / 45) % 8]}${por(v)}`;
    case 'arrive':
      return modifier === 'right' || modifier === 'left' ? `Llegaste: el destino está ${lado}` : 'Llegaste a destino';
    case 'roundabout':
    case 'rotary':
      return exit ? `En la rotonda, tomá la ${ORDINAL[exit] ?? `${exit}.ª`} salida${por(v)}` : `Entrá a la rotonda${por(v)}`;
    case 'exit roundabout':
    case 'exit rotary':
      return `Salí de la rotonda${por(v)}`;
    case 'fork':
      return `En la bifurcación, mantenete ${lado || 'derecho'}${por(v)}`;
    case 'merge':
      return `Incorporate${v ? ` a ${v}` : ' al camino'}`;
    case 'on ramp':
      return `Tomá el acceso ${lado}${v ? ` hacia ${v}` : ''}`.replace('  ', ' ');
    case 'off ramp':
      return `Tomá la salida ${lado}${por(v)}`.replace('  ', ' ');
    case 'end of road':
      return `Al final del camino, doblá ${lado}${por(v)}`;
    case 'new name':
    case 'continue':
    case 'notification':
      return modifier === 'uturn' ? 'Pegá la vuelta en U' : `Seguí${modifier && modifier !== 'straight' ? ` ${lado}` : ''}${por(v)}`;
    default:
      if (modifier === 'uturn') return `Pegá la vuelta en U${por(v)}`;
      if (modifier === 'straight') return `Seguí derecho${por(v)}`;
      return `Doblá ${lado}${por(v)}`;
  }
}

// Icono que usa la pantalla para la flecha de cada maniobra.
export function flechaDe({ type, modifier }) {
  if (type === 'arrive') return 'llegada';
  if (type === 'depart') return 'derecho';
  if (type === 'roundabout' || type === 'rotary') return 'rotonda';
  if (modifier === 'uturn') return 'u';
  if (!modifier || modifier === 'straight') return 'derecho';
  return modifier.replace(' ', '-');
}
