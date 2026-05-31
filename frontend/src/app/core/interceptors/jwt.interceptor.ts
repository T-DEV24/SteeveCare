// src/app/core/interceptors/jwt.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Routes publiques qui ne nécessitent pas de token */
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/doctors/search',
];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isPublic = PUBLIC_PATHS.some(p => req.url.includes(p))
    || req.url.match(/\/api\/doctors\/\d+$/) !== null;

  if (!isPublic) {
    const token = authService.token();
    if (token) {
      if (authService.isTokenExpired(token)) {
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => new Error('JWT expiré'));
      }

      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublic) {
        authService.logout();
        router.navigate(['/auth/login']);
      }

      if (error.status === 403 && !isPublic) {
        const msg: string = error.error?.erreur ?? '';
        if (msg.toLowerCase().includes('suspendu') ||
            msg.toLowerCase().includes('frozen')) {
          authService.logout();
          router.navigate(['/auth/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
