// Tipos de evento que la gente puede reportar, con las horas que dura cada reporte antes de expirar.
export const TIPOS_REPORTE = {
  neblina: { etiqueta: 'Neblina', horas: 2, grave: true },
  corte: { etiqueta: 'Corte de ruta', horas: 8, grave: true },
  derrumbe: { etiqueta: 'Derrumbe', horas: 8, grave: true },
  crecida: { etiqueta: 'Crecida o agua en la ruta', horas: 5, grave: true },
  barro: { etiqueta: 'Barro o piedras', horas: 5, grave: false },
  hielo: { etiqueta: 'Hielo', horas: 5, grave: true },
  nevada: { etiqueta: 'Nevada', horas: 5, grave: true },
  accidente: { etiqueta: 'Accidente', horas: 3, grave: true },
  bache: { etiqueta: 'Baches', horas: 24, grave: false },
  obras: { etiqueta: 'Obras o desvío', horas: 12, grave: false },
  fila: { etiqueta: 'Fila / demora', horas: 2, grave: false },
};

export const MINIMO_PARA_CONFIRMAR = 2;
