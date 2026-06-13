import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { HeadersService } from './headers.service';

type JwtPayload = {
  rol?: string;
  exp?: number;
};

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly headersService = inject(HeadersService);

  readonly isAuthenticated = signal(this.hasValidSession());

  startSession(token: string, rol: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    this.headersService.setToken(token);
    this.isAuthenticated.set(true);
  }

  refreshState(): boolean {
    const isAuthenticated = this.hasValidSession();
    this.isAuthenticated.set(isAuthenticated);
    return isAuthenticated;
  }

  clearSession(redirectToLogin = false): void {
    this.clearStoredSession();
    this.isAuthenticated.set(false);

    if (redirectToLogin) {
      void this.router.navigate(['/auth']);
    }
  }

  private hasValidSession(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const token = localStorage.getItem('token');
    const payload = token ? this.readJwtPayload(token) : null;
    const isValid =
      !!token &&
      payload?.rol === 'Admin' &&
      typeof payload.exp === 'number' &&
      payload.exp * 1000 > Date.now();

    if (!isValid) {
      this.clearStoredSession();
      return false;
    }

    this.headersService.setToken(token);
    return true;
  }

  private clearStoredSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
    }

    this.headersService.clearToken();
  }

  private readJwtPayload(token: string): JwtPayload | null {
    try {
      const encodedPayload = token.split('.')[1];
      if (!encodedPayload) return null;
      const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(normalizedPayload)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
