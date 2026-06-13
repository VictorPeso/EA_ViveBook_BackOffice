export interface LibroRef {
  _id: string;
  title?: string;
  isbn?: string;
  type?: 'VENTA' | 'ALQUILER';
}

export interface UsuarioRef {
  _id: string;
  name?: string;
  email?: string;
  rol?: 'Admin' | 'User';
}

export interface Usuario {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  authProvider?: 'local' | 'google' | 'apple';
  rol: 'Admin' | 'User';
  libros?: string[] | LibroRef[];
  boughtLibros?: string[] | LibroRef[];
  rentedLibros?: string[] | LibroRef[];
  favoriteAuthors?: string[];
  favoriteBooks?: string[] | LibroRef[];
  favoriteCategories?: string[];
  wishlist?: string[] | LibroRef[];
  followingUsers?: string[] | UsuarioRef[];
  favoritos?: string[] | LibroRef[];
  avatar?: string | null;
  description?: string;
  IsDeleted?: boolean;
  hasSeenTutorial?: boolean;
  notificationUsersEnabled?: string[] | UsuarioRef[];
  createdAt?: string;
  updatedAt?: string;
}
