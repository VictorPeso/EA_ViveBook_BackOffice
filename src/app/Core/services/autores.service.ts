import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Autor } from '../models/autor.model';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';

export type AdminAutorSearchField = 'fullName' | '_id';

export interface AdminAutoresQuery {
  page: number;
  limit: number;
  search?: string;
  searchField?: AdminAutorSearchField;
  includeDeleted?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AutoresService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/autores';
  private readonly adminApiUrl = environment.apiUrl + '/admin/autores';

  getAutores(): Observable<Autor[]> {
    return this.http
      .get<ApiResponse<PaginatedResult<Autor>>>(this.apiUrl)
      .pipe(map((response) => response.data.data));
  }

  getAllAutores(): Observable<Autor[]> {
    return this.http
      .get<ApiResponse<PaginatedResult<Autor>>>(`${this.apiUrl}/all`)
      .pipe(map((response) => response.data.data));
  }

  getAutorById(autorId: string): Observable<Autor> {
    return this.http
      .get<ApiResponse<Autor>>(`${this.adminApiUrl}/${autorId}`)
      .pipe(map((response) => response.data));
  }

  getAdminAutores(query: AdminAutoresQuery): Observable<PaginatedResult<Autor>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeDeleted', query.includeDeleted ?? true);

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
      params = params.set('searchField', query.searchField ?? 'fullName');
    }

    return this.http
      .get<ApiResponse<PaginatedResult<Autor>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  createAutor(autor: Autor): Observable<Autor> {
    return this.http
      .post<ApiResponse<Autor>>(this.adminApiUrl, autor)
      .pipe(map((response) => response.data));
  }

  updateAutor(autorId: string, autor: Partial<Autor>): Observable<Autor> {
    return this.http
      .put<ApiResponse<Autor>>(`${this.adminApiUrl}/${autorId}`, autor)
      .pipe(map((response) => response.data));
  }

  setAutorDeleted(autorId: string, IsDeleted: boolean): Observable<Autor> {
    return this.http
      .patch<ApiResponse<Autor>>(`${this.adminApiUrl}/${autorId}/status`, { IsDeleted })
      .pipe(map((response) => response.data));
  }

  softDeleteAutor(autorId: string): Observable<Autor> {
    return this.http
      .delete<ApiResponse<Autor>>(`${this.adminApiUrl}/${autorId}`)
      .pipe(map((response) => response.data));
  }

  permanentDeleteAutor(autorId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.adminApiUrl}/${autorId}/permanent`)
      .pipe(map(() => undefined));
  }

  restoreAutor(autorId: string): Observable<Autor> {
    return this.setAutorDeleted(autorId, false);
  }
}
