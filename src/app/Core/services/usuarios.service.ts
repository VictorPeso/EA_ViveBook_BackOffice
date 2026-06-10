import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HeadersService } from './headers.service';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/usuarios';

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

  signup(userData: any): Observable<any> {
    const signupUrl = `${environment.apiUrl}/auth/signup`;
    return this.http.post<any>(signupUrl, userData);
  }

  login(credentials: any): Observable<any> {
    const loginUrl = `${environment.apiUrl}/auth/signin`;
    return this.http.post<any>(loginUrl, credentials).pipe(
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
    return this.http.get<any>(`${this.apiUrl}/auth/profile`);
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
    return this.http.get<Usuario[]>(this.apiUrl, { headers: this.headersService.getHeader() });
  }

  getAllUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/all`, {
      headers: this.headersService.getHeader(),
    });
  }

  getUsuarioById(usuarioId: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${usuarioId}`);
  }

  createUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  updateUsuario(usuarioId: string, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${usuarioId}`, usuario);
  }

  softDeleteUsuario(usuarioId: string, usuarioActual: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${usuarioId}`, {
      ...usuarioActual,
      IsDeleted: true,
    });
  }

  restoreUsuario(usuarioId: string, usuarioActual: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/restore/${usuarioId}`, {
      ...usuarioActual,
      IsDeleted: false,
    });
  }

  permanentDeleteUsuario(usuarioId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/permanent/${usuarioId}`);
  }
}
