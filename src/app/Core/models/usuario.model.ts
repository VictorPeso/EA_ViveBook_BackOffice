export interface LibroRef {
  _id: string;
  title?: string;
}

export interface Usuario {
  _id?: string;
  name: string;
  email: string;
  password: string;
  libros?: string[] | LibroRef[];
  IsDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}