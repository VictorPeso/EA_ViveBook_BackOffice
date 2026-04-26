import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/usuarios';

 login(credentials: any): Observable<any> {
    const loginUrl = `${environment.apiUrl}/auth/signin`; 
    
    return this.http.post<any>(loginUrl, credentials).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('rol', res.user.rol);
        }
      })
    );
  }
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  getAllUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/all`);
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
