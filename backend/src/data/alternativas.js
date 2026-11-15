// Que hacer cuando un tramo esta cortado. Solo se carga un desvio si tiene un antecedente oficial.
export const PARTE_OFICIAL = {
  nombre: 'Vialidad Nacional – Estado de rutas',
  url: 'https://www.argentina.gob.ar/transporte/vialidad-nacional/estado-de-rutas',
  telefono: '0800-222-6272',
};

const DESVIO_PUNA = {
  descripcion: 'En el corte de enero de 2017 el desvío oficial para salir de la Quebrada fue por las rutas 40 y 70 hacia San Antonio de los Cobres y Salta. Es un camino de Puna, largo y con ripio: confirmá que esté habilitado antes de tomarlo.',
  fuente: 'https://prensa.jujuy.gob.ar/gerardo-morales/viajeros-chile-deberan-utilizar-sico-se-restablezca-el-transito-la-r-n-9-n10809',
};

const ALTERNATIVAS = { volcan: DESVIO_PUNA, tumbaya: DESVIO_PUNA };

export const alternativaDe = (tramoId) => ALTERNATIVAS[tramoId] ?? null;
