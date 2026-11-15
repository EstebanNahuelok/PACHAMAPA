// Tipos de evento que la gente puede reportar, con las horas que dura cada reporte antes de expirar.
// conLargo: el hecho ocupa un trecho de la ruta y se puede marcar donde empieza y donde termina.
export const TIPOS_REPORTE = {
  neblina: { etiqueta: 'Neblina', horas: 2, grave: true },
  corte: { etiqueta: 'Corte de ruta', horas: 8, grave: true, conLargo: true },
  derrumbe: { etiqueta: 'Derrumbe', horas: 8, grave: true },
  crecida: { etiqueta: 'Crecida o agua en la ruta', horas: 5, grave: true },
  barro: { etiqueta: 'Barro o piedras', horas: 5, grave: false },
  hielo: { etiqueta: 'Hielo', horas: 5, grave: true },
  nevada: { etiqueta: 'Nevada', horas: 5, grave: true },
  accidente: { etiqueta: 'Accidente', horas: 3, grave: true },
  bache: { etiqueta: 'Baches', horas: 24, grave: false },
  obras: { etiqueta: 'Obras o desvío', horas: 12, grave: false, conLargo: true },
  fila: { etiqueta: 'Fila / demora', horas: 2, grave: false, conLargo: true },
};

export const MINIMO_PARA_CONFIRMAR = 2;
