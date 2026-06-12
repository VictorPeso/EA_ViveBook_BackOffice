import { Libro } from './libro.model';
import { Usuario } from './usuario.model';

export type PostStatus = 'VENTA' | 'ALQUILER' | 'NO_DISPONIBLE';

export interface Post {
  _id?: string;
  description: string;
  status: PostStatus;
  imageUrl?: string | null;
  IsDeleted?: boolean;
  ownerId: string | Usuario;
  bookId: string | Libro;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}
