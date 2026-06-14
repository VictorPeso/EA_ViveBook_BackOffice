import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { environment } from '../../../environments/environment';
import { AuthSessionService } from './auth-session.service';

export type AdminUsuarioSearchField = 'name' | 'email' | 'role' | '_id';

export interface AdminUsuariosQuery {
  page: number;
  limit: number;
  search?: string;
  searchField?: AdminUsuarioSearchField;
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

  private readonly authSession = inject(AuthSessionService);

  //son señales para manejar el estado de autenticación en toda la aplicación,
  //permitiendo que el topbar reaccionen a los cambios en el estado de autenticación de manera eficiente.
  readonly isAuthenticated = this.authSession.isAuthenticated;

  updateAuthState(): boolean {
    return this.authSession.refreshState();
  }

  //------------------------- AUTENTICACIÓN -------------------------

  signup(userData: Partial<Usuario>): Observable<{ user: Usuario; token: string }> {
    const signupUrl = `${environment.apiUrl}/auth/admin-signup`;
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
            this.authSession.startSession(res.token, res.user.rol);
          }
        }),
      );
  }

  getProfile() {
    return this.http
      .get<ApiResponse<Usuario>>(`${environment.apiUrl}/auth/profile`)
      .pipe(map((response) => response.data));
  }

  logout(): void {
    this.authSession.clearSession(true);
  }

  clearSession(): void {
    this.authSession.clearSession();
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
      params = params.set('searchField', query.searchField ?? 'name');
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

  permanentDeleteUsuario(usuarioId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.adminApiUrl}/${usuarioId}/permanent`)
      .pipe(map(() => undefined));
  }

  restoreUsuario(usuarioId: string): Observable<Usuario> {
    return this.setUsuarioDeleted(usuarioId, false);
  }
}
