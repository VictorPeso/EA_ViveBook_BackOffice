import { Libro } from './libro.model';
import { Usuario } from './usuario.model';

export type EstadoReserva = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface Reserva {
  _id?: string;
  libro: string | Libro;
  usuarioSolicitante: string | Usuario;
  propietario: string | Usuario;
  estado: EstadoReserva;
  fechaSolicitud: string;
  fechaLimite?: string | null;
  IsDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
