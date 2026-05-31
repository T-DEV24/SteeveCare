// src/app/core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

const PUBLIC_AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/auth/login',
  '/auth/register'
];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some(path => req.url.includes(path));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isPublicAuthRequest) {
        return throwError(() => error);
      }

      switch (error.status) {
        case 401:
          authService.logout();
          router.navigate(['/auth/login']);
          break;

        case 403:
          notification.error('Accès refusé', 5000);
          break;

        case 500:
          notification.error('Erreur serveur, réessayez', 6000);
          break;

        case 0:
          notification.error('Connexion impossible', 6000);
          break;
      }

      return throwError(() => error);
    })
  );
};
