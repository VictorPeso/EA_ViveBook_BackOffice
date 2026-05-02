import { Libro } from "./libro.model";

export enum PostStatus {
    'VENTA',
    'ALQUILER',
    'NO_DISPONIBLE'
}

export interface Post{
    _id : string;
    description: string;
    status: string; //PostStatus; // nunca he probado a hacer un enum en typescript
    imageUrl?: string; // opcional, si no sube nada entonces le ponemos un imagen default
    IsDeleted?: boolean;
    ownerId: string;
    bookId: Libro;
}
