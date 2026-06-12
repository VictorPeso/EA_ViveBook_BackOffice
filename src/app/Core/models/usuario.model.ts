export interface LibroRef {
  _id: string;
  title?: string;
}

export interface Usuario {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  rol: 'Admin' | 'User';
  libros?: string[] | LibroRef[];
  avatar?: string | null;
  description?: string;
  IsDeleted?: boolean;
  hasSeenTutorial?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
