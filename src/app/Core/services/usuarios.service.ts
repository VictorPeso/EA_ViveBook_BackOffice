import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HeadersService } from './headers.service';

export interface AdminUsuariosQuery {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
  rol?: Usuario['rol'];
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/usuarios';
  private readonly adminApiUrl = environment.apiUrl + '/admin/usuarios';

  private readonly router = inject(Router);

  //son señales para manejar el estado de autenticación en toda la aplicación,
  //permitiendo que el topbar reaccionen a los cambios en el estado de autenticación de manera eficiente.
  private platformId = inject(PLATFORM_ID);

  isAuthenticated = signal<boolean>(this.checkToken());

  private checkToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  updateAuthState() {
    this.isAuthenticated.set(this.checkToken());
  }

  //------------------------- AUTENTICACIÓN -------------------------

  signup(userData: Partial<Usuario>): Observable<{ user: Usuario; token: string }> {
    const signupUrl = `${environment.apiUrl}/auth/signup`;
    return this.http
      .post<ApiResponse<{ user: Usuario; token: string }>>(signupUrl, userData)
      .pipe(map((response) => response.data));
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<{ user: Usuario; token: string }> {
    const loginUrl = `${environment.apiUrl}/auth/signin`;
    return this.http
      .post<ApiResponse<{ user: Usuario; token: string }>>(loginUrl, credentials)
      .pipe(
        map((response) => {
          if (response.data.user.rol !== 'Admin') {
            throw new Error('El BackOffice requiere una cuenta con rol Admin.');
          }

          return response.data;
        }),
        tap((res) => {
          if (res.token) {
            this.headersService.setToken(res.token);
            localStorage.setItem('token', res.token);
            localStorage.setItem('rol', res.user.rol);
            this.isAuthenticated.set(true);
          }
        }),
      );
  }

  headersService = inject(HeadersService);

  getProfile() {
    return this.http
      .get<ApiResponse<Usuario>>(`${environment.apiUrl}/auth/profile`)
      .pipe(map((response) => response.data));
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear(); // Borra TODO para evitar estados fantasma
      this.isAuthenticated.set(false); // Forzamos a la señal a ser FALSE
      this.router.navigate(['/auth']);
    }
  }

  //------------------------- CRUD USUARIOS -------------------------

  getUsuarios(): Observable<Usuario[]> {
    return this.http
      .get<ApiResponse<PaginatedResult<Usuario>>>(this.apiUrl)
      .pipe(map((response) => response.data.data));
  }

  getAllUsuarios(): Observable<Usuario[]> {
    return this.http
      .get<ApiResponse<PaginatedResult<Usuario>>>(`${this.apiUrl}/all`)
      .pipe(map((response) => response.data.data));
  }

  getAdminUsuarios(query: AdminUsuariosQuery): Observable<PaginatedResult<Usuario>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeDeleted', query.includeDeleted ?? true);

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.rol) {
      params = params.set('rol', query.rol);
    }

    return this.http
      .get<ApiResponse<PaginatedResult<Usuario>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  getUsuarioById(usuarioId: string): Observable<Usuario> {
    return this.http
      .get<ApiResponse<Usuario>>(`${this.adminApiUrl}/${usuarioId}`)
      .pipe(map((response) => response.data));
  }

  createUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http
      .post<ApiResponse<Usuario>>(this.adminApiUrl, usuario)
      .pipe(map((response) => response.data));
  }

  updateUsuario(usuarioId: string, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http
      .put<ApiResponse<Usuario>>(`${this.adminApiUrl}/${usuarioId}`, usuario)
      .pipe(map((response) => response.data));
  }

  setUsuarioDeleted(usuarioId: string, IsDeleted: boolean): Observable<Usuario> {
    return this.http
      .patch<ApiResponse<Usuario>>(`${this.adminApiUrl}/${usuarioId}/status`, { IsDeleted })
      .pipe(map((response) => response.data));
  }

  softDeleteUsuario(usuarioId: string): Observable<Usuario> {
    return this.http
      .delete<ApiResponse<Usuario>>(`${this.adminApiUrl}/${usuarioId}`)
      .pipe(map((response) => response.data));
  }

  restoreUsuario(usuarioId: string): Observable<Usuario> {
    return this.setUsuarioDeleted(usuarioId, false);
  }
}
