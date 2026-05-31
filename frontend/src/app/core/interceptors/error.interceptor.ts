// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router    = inject(Router);
  const snackBar  = inject(MatSnackBar);
  const auth      = inject(AuthService);

  // Routes publiques — on ne gère pas leurs erreurs de la même façon
  const isPublic = ['/api/auth/login', '/api/auth/register'].some(p => req.url.includes(p));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isPublic) return throwError(() => error);

      switch (error.status) {
        case 401:
          // Token expiré ou invalide → déconnecter et rediriger
          auth.logout();
          router.navigate(['/auth/login']);
          break;

        case 403:
          // Accès refusé
          snackBar.open(
            error.error?.erreur ?? 'Accès refusé — droits insuffisants',
            '✕',
            { duration: 5000, panelClass: ['snack-error'] }
          );
          break;

        case 404:
          // Ressource non trouvée — laisser le composant gérer
          break;

        case 409:
          // Conflit (ex: créneau déjà pris) — laisser le composant gérer
          break;

        case 0:
        case 503:
          // Serveur inaccessible
          snackBar.open(
            'Le serveur est inaccessible. Vérifiez votre connexion.',
            '✕',
            { duration: 6000, panelClass: ['snack-error'] }
          );
          break;

        case 500:
        default:
          if (error.status >= 500) {
            snackBar.open(
              'Erreur serveur — veuillez réessayer dans quelques instants.',
              '✕',
              { duration: 6000, panelClass: ['snack-error'] }
            );
          }
          break;
      }

      return throwError(() => error);
    })
  );
};
