import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { Libreria } from '../models/libreria.model';

export interface AdminLibreriasQuery {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LibreriasService {
  private readonly http = inject(HttpClient);
  private readonly adminApiUrl = environment.apiUrl + '/admin/librerias';

  getAdminLibrerias(query: AdminLibreriasQuery): Observable<PaginatedResult<Libreria>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeDeleted', query.includeDeleted ?? true);

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.http
      .get<ApiResponse<PaginatedResult<Libreria>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  createLibreria(libreria: Libreria): Observable<Libreria> {
    return this.http
      .post<ApiResponse<Libreria>>(this.adminApiUrl, libreria)
      .pipe(map((response) => response.data));
  }

  updateLibreria(libreriaId: string, libreria: Partial<Libreria>): Observable<Libreria> {
    return this.http
      .put<ApiResponse<Libreria>>(`${this.adminApiUrl}/${libreriaId}`, libreria)
      .pipe(map((response) => response.data));
  }

  softDeleteLibreria(libreriaId: string): Observable<Libreria> {
    return this.http
      .delete<ApiResponse<Libreria>>(`${this.adminApiUrl}/${libreriaId}`)
      .pipe(map((response) => response.data));
  }

  restoreLibreria(libreriaId: string): Observable<Libreria> {
    return this.http
      .patch<ApiResponse<Libreria>>(`${this.adminApiUrl}/${libreriaId}/status`, {
        IsDeleted: false,
      })
      .pipe(map((response) => response.data));
  }
}
