// src/app/core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
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
