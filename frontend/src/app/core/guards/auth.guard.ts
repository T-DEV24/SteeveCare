// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const redirectToLogin = () => {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  };

  if (!authService.isLoggedIn()) {
    return redirectToLogin();
  }

  const token = authService.token();
  if (!token || authService.isTokenExpired(token)) {
    authService.logout(false);
    return redirectToLogin();
  }

  return true;
};
