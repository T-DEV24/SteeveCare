// src/app/core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          authService.logout();
          router.navigate(['/auth/login']);
          break;

        case 403:
          snackBar.open('Accès refusé', '✕', {
            duration: 5000,
            panelClass: ['snack-error']
          });
          break;

        case 500:
          snackBar.open('Erreur serveur, réessayez', '✕', {
            duration: 6000,
            panelClass: ['snack-error']
          });
          break;

        case 0:
          snackBar.open('Connexion impossible', '✕', {
            duration: 6000,
            panelClass: ['snack-error']
          });
          break;
      }

      return throwError(() => error);
    })
  );
};
