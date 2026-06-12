export type TipoReto =
  | 'COMPRAR_LIBROS'
  | 'ALQUILAR_LIBROS'
  | 'SEGUIR_USUARIOS'
  | 'RECIBIR_VALORACIONES'
  | 'ASISTIR_EVENTOS'
  | 'SUBIR_LIBROS';

export interface Reto {
  _id?: string;
  title: string;
  description: string;
  type: TipoReto;
  objetivo: number;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
