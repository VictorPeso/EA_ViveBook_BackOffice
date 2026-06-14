import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { Evento } from '../models/evento.model';

export type AdminEventoSearchField = 'title' | 'eventDate' | 'address' | '_id';

export interface AdminEventosQuery {
  page: number;
  limit: number;
  search?: string;
  searchField?: AdminEventoSearchField;
  includeDeleted?: boolean;
  upcoming?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly adminApiUrl = environment.apiUrl + '/admin/eventos';

  getAdminEventos(query: AdminEventosQuery): Observable<PaginatedResult<Evento>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeDeleted', query.includeDeleted ?? true);
    if (query.search?.trim()) {
      params = params
        .set('search', query.search.trim())
        .set('searchField', query.searchField ?? 'title');
    }
    if (query.upcoming !== undefined) params = params.set('upcoming', query.upcoming);
    return this.http
      .get<ApiResponse<PaginatedResult<Evento>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  createEvento(evento: Evento): Observable<Evento> {
    return this.http
      .post<ApiResponse<Evento>>(this.adminApiUrl, evento)
      .pipe(map((response) => response.data));
  }

  updateEvento(id: string, evento: Partial<Evento>): Observable<Evento> {
    return this.http
      .put<ApiResponse<Evento>>(`${this.adminApiUrl}/${id}`, evento)
      .pipe(map((response) => response.data));
  }

  softDeleteEvento(id: string): Observable<Evento> {
    return this.http
      .delete<ApiResponse<Evento>>(`${this.adminApiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  permanentDeleteEvento(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.adminApiUrl}/${id}/permanent`)
      .pipe(map(() => undefined));
  }

  restoreEvento(id: string): Observable<Evento> {
    return this.http
      .patch<ApiResponse<Evento>>(`${this.adminApiUrl}/${id}/status`, { IsDeleted: false })
      .pipe(map((response) => response.data));
  }
}
