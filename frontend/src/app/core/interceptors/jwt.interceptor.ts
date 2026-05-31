// src/app/core/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Routes publiques qui ne nécessitent pas de token */
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/doctors/search',
];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const isPublic = PUBLIC_PATHS.some(p => req.url.includes(p))
    || req.url.match(/\/api\/doctors\/\d+$/) !== null;

  // Injecter le token sur les routes protégées
  if (!isPublic) {
    const token = authService.token();
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Vérification du statut du compte
      if (error.status === 401 && !isPublic) {
        authService.logout();
        router.navigate(['/auth/login']);
      }
      if (error.status === 403) {
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
