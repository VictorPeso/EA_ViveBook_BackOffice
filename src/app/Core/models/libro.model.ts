export interface AutorRef {
  _id: string;
  fullName?: string;
}

export interface Libro {
  _id?: string;
  isbn?: string;
  title: string;
  authors: string[] | AutorRef[];
  IsDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}