// auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { UsuariosService } from '../../../Core/services/usuarios.service';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const router = inject(Router);
  const authService = inject(UsuariosService);

  if (authService.updateAuthState()) {
    return true;
  }

  return router.createUrlTree(['/auth']);
};
