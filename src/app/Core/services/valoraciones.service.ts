import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { TipoOperacion, Valoracion } from '../models/valoracion.model';

export interface AdminValoracionesQuery {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
  puntuacion?: number;
  tipoOperacion?: TipoOperacion;
}

@Injectable({ providedIn: 'root' })
export class ValoracionesService {
  private readonly http = inject(HttpClient);
  private readonly adminApiUrl = environment.apiUrl + '/admin/valoraciones';

  getAdminValoraciones(query: AdminValoracionesQuery): Observable<PaginatedResult<Valoracion>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeDeleted', query.includeDeleted ?? true);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.puntuacion) params = params.set('puntuacion', query.puntuacion);
    if (query.tipoOperacion) params = params.set('tipoOperacion', query.tipoOperacion);
    return this.http
      .get<ApiResponse<PaginatedResult<Valoracion>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  createValoracion(valoracion: Valoracion): Observable<Valoracion> {
    return this.http
      .post<ApiResponse<Valoracion>>(this.adminApiUrl, valoracion)
      .pipe(map((response) => response.data));
  }

  updateValoracion(id: string, valoracion: Partial<Valoracion>): Observable<Valoracion> {
    return this.http
      .put<ApiResponse<Valoracion>>(`${this.adminApiUrl}/${id}`, valoracion)
      .pipe(map((response) => response.data));
  }

  softDeleteValoracion(id: string): Observable<Valoracion> {
    return this.http
      .delete<ApiResponse<Valoracion>>(`${this.adminApiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  restoreValoracion(id: string): Observable<Valoracion> {
    return this.http
      .patch<ApiResponse<Valoracion>>(`${this.adminApiUrl}/${id}/status`, { IsDeleted: false })
      .pipe(map((response) => response.data));
  }
}
