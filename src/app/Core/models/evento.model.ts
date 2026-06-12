import { Usuario } from './usuario.model';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface Evento {
  _id?: string;
  title: string;
  description: string;
  creator: string | Usuario;
  participant: Array<string | Usuario>;
  eventDate: string;
  createdDate?: string;
  location: GeoPoint;
  direccionExacta: string;
  IsDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
