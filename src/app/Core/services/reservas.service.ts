import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { EstadoReserva, Reserva } from '../models/reserva.model';

export interface AdminReservasQuery {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
  estado?: EstadoReserva;
}

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly adminApiUrl = environment.apiUrl + '/admin/reservas';

  getAdminReservas(query: AdminReservasQuery): Observable<PaginatedResult<Reserva>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeDeleted', query.includeDeleted ?? true);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.estado) params = params.set('estado', query.estado);
    return this.http
      .get<ApiResponse<PaginatedResult<Reserva>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  createReserva(reserva: Reserva): Observable<Reserva> {
    return this.http
      .post<ApiResponse<Reserva>>(this.adminApiUrl, reserva)
      .pipe(map((response) => response.data));
  }

  updateReserva(id: string, reserva: Partial<Reserva>): Observable<Reserva> {
    return this.http
      .put<ApiResponse<Reserva>>(`${this.adminApiUrl}/${id}`, reserva)
      .pipe(map((response) => response.data));
  }

  softDeleteReserva(id: string): Observable<Reserva> {
    return this.http
      .delete<ApiResponse<Reserva>>(`${this.adminApiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  restoreReserva(id: string): Observable<Reserva> {
    return this.http
      .patch<ApiResponse<Reserva>>(`${this.adminApiUrl}/${id}/status`, { IsDeleted: false })
      .pipe(map((response) => response.data));
  }
}
