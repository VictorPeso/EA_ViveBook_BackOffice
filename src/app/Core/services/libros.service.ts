import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Libro } from '../models/libro.model';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';

export type AdminLibroSearchField = 'title' | 'isbn' | 'author' | '_id';

export interface AdminLibrosQuery {
  page: number;
  limit: number;
  search?: string;
  searchField?: AdminLibroSearchField;
  includeDeleted?: boolean;
  type?: Libro['type'];
  estado?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LibrosService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/libros';
  private readonly adminApiUrl = environment.apiUrl + '/admin/libros';

  getLibros(): Observable<Libro[]> {
    return this.http
      .get<ApiResponse<PaginatedResult<Libro>>>(this.apiUrl)
      .pipe(map((response) => response.data.data));
  }

  getAllLibros(): Observable<Libro[]> {
    return this.http
      .get<ApiResponse<PaginatedResult<Libro>>>(`${this.apiUrl}/all`)
      .pipe(map((response) => response.data.data));
  }

  getLibroById(libroId: string): Observable<Libro> {
    return this.http
      .get<ApiResponse<Libro>>(`${this.adminApiUrl}/${libroId}`)
      .pipe(map((response) => response.data));
  }

  getAdminLibros(query: AdminLibrosQuery): Observable<PaginatedResult<Libro>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeDeleted', query.includeDeleted ?? true);

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
      params = params.set('searchField', query.searchField ?? 'title');
    }

    if (query.type) {
      params = params.set('type', query.type);
    }

    if (query.estado?.trim()) {
      params = params.set('estado', query.estado.trim());
    }

    return this.http
      .get<ApiResponse<PaginatedResult<Libro>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  createLibro(libro: Libro): Observable<Libro> {
    return this.http
      .post<ApiResponse<Libro>>(this.adminApiUrl, libro)
      .pipe(map((response) => response.data));
  }

  updateLibro(libroId: string, libro: Partial<Libro>): Observable<Libro> {
    return this.http
      .put<ApiResponse<Libro>>(`${this.adminApiUrl}/${libroId}`, libro)
      .pipe(map((response) => response.data));
  }

  createLibroByIsbn(isbn: string): Observable<Libro> {
    return this.http
      .get<ApiResponse<Libro>>(`${this.apiUrl}/isbn/${encodeURIComponent(isbn)}`)
      .pipe(map((response) => response.data));
  }

  setLibroDeleted(libroId: string, IsDeleted: boolean): Observable<Libro> {
    return this.http
      .patch<ApiResponse<Libro>>(`${this.adminApiUrl}/${libroId}/status`, { IsDeleted })
      .pipe(map((response) => response.data));
  }

  softDeleteLibro(libroId: string): Observable<Libro> {
    return this.http
      .delete<ApiResponse<Libro>>(`${this.adminApiUrl}/${libroId}`)
      .pipe(map((response) => response.data));
  }

  permanentDeleteLibro(libroId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.adminApiUrl}/${libroId}/permanent`)
      .pipe(map(() => undefined));
  }

  restoreLibro(libroId: string): Observable<Libro> {
    return this.setLibroDeleted(libroId, false);
  }
}
