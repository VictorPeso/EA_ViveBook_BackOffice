export interface LibroRef {
  _id: string;
  title?: string;
}

export interface Usuario {
  _id?: string;
  name: string;
  email: string;
  password: string;
  rol: 'Admin' | 'User';
  libros?: string[] | LibroRef[];
  IsDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
