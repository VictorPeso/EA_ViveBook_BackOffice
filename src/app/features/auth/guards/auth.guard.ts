// auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

type JwtPayload = {
  rol?: string;
  exp?: number;
};

const readJwtPayload = (token: string): JwtPayload | null => {
  try {
    const encodedPayload = token.split('.')[1];
    const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalizedPayload)) as JwtPayload;
  } catch {
    return null;
  }
};

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const router = inject(Router);
  const token = localStorage.getItem('token');
  const payload = token ? readJwtPayload(token) : null;
  const isExpired = payload?.exp ? payload.exp * 1000 <= Date.now() : true;

  if (token && payload?.rol === 'Admin' && !isExpired) {
    return true;
  }

  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  return router.createUrlTree(['/auth']);
};
