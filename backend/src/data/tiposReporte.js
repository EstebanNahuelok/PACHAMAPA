// Tipos de evento que la gente puede reportar, con las horas que dura cada reporte antes de expirar.
export const TIPOS_REPORTE = {
  neblina: { etiqueta: 'Neblina', horas: 2, grave: true },
  corte: { etiqueta: 'Corte de ruta', horas: 8, grave: true },
  derrumbe: { etiqueta: 'Derrumbe', horas: 8, grave: true },
  hielo: { etiqueta: 'Hielo', horas: 5, grave: true },
  nevada: { etiqueta: 'Nevada', horas: 5, grave: true },
  accidente: { etiqueta: 'Accidente', horas: 3, grave: true },
  fila: { etiqueta: 'Fila / demora', horas: 2, grave: false },
};

export const MINIMO_PARA_CONFIRMAR = 2;
