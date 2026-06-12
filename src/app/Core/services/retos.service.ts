import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { Reto, TipoReto } from '../models/reto.model';

export interface AdminRetosQuery {
  page: number;
  limit: number;
  search?: string;
  includeInactive?: boolean;
  type?: TipoReto;
}

@Injectable({ providedIn: 'root' })
export class RetosService {
  private readonly http = inject(HttpClient);
  private readonly adminApiUrl = environment.apiUrl + '/admin/retos';

  getAdminRetos(query: AdminRetosQuery): Observable<PaginatedResult<Reto>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeInactive', query.includeInactive ?? true);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.type) params = params.set('type', query.type);
    return this.http
      .get<ApiResponse<PaginatedResult<Reto>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  createReto(reto: Reto): Observable<Reto> {
    return this.http
      .post<ApiResponse<Reto>>(this.adminApiUrl, reto)
      .pipe(map((response) => response.data));
  }

  updateReto(id: string, reto: Partial<Reto>): Observable<Reto> {
    return this.http
      .put<ApiResponse<Reto>>(`${this.adminApiUrl}/${id}`, reto)
      .pipe(map((response) => response.data));
  }

  deactivateReto(id: string): Observable<Reto> {
    return this.http
      .delete<ApiResponse<Reto>>(`${this.adminApiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  activateReto(id: string): Observable<Reto> {
    return this.http
      .patch<ApiResponse<Reto>>(`${this.adminApiUrl}/${id}/status`, { activo: true })
      .pipe(map((response) => response.data));
  }
}
