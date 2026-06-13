import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthSessionService } from '../../../Core/services/auth-session.service';
import { environment } from '../../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser ? localStorage.getItem('token') : null;
  const isBackendRequest = req.url.startsWith(environment.apiUrl);
  const request = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        token &&
        isBackendRequest &&
        error instanceof HttpErrorResponse &&
        (error.status === 401 || error.status === 403)
      ) {
        authSession.clearSession(true);
      }

      return throwError(() => error);
    }),
  );
};
