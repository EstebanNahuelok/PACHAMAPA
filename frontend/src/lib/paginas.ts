// Paginas de la portada; cada una se abre con su hash (#inicio, #pacha...).
export const PAGINAS = ['inicio', 'como-funciona', 'seguridad', 'a-quien-llamar', 'pacha'] as const
export type Pagina = (typeof PAGINAS)[number]
