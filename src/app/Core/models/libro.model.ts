export interface AutorRef {
  _id: string;
  fullName?: string;
}

export interface UsuarioRef {
  _id: string;
  name?: string;
  email?: string;
}

export interface Libro {
  _id?: string;
  isbn: string;
  title: string;
  authors: string[] | AutorRef[];
  autor?: string;
  categoria?: string;
  type: 'VENTA' | 'ALQUILER';
  precio: number;
  estado: string;
  owner?: string | UsuarioRef | null;
  IsDeleted?: boolean;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  imageUrl?: string | null;
  isReserved?: boolean;
  reservedBy?: string | UsuarioRef | null;
  reservationExpiry?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
