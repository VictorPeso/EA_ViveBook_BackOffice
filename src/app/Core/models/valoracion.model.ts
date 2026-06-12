import { Libro } from './libro.model';
import { Usuario } from './usuario.model';

export type TipoOperacion = 'VENTA' | 'ALQUILER' | 'RESERVA';

export interface Valoracion {
  _id?: string;
  usuarioAutor: string | Usuario;
  usuarioValorado: string | Usuario;
  libro: string | Libro;
  tipoOperacion: TipoOperacion;
  puntuacion: number;
  comentario?: string;
  reservationId?: string | null;
  IsDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
