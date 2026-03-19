import { Libro } from './libro.model';

export interface Usuario {
  _id: string;
  name: string;
  email: string;     
  password?: string;
  libro: Libro[];
  createdAt?: string;
  updatedAt?: string;
}