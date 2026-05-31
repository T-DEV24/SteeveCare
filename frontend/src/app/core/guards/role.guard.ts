// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService    = inject(AuthService);
  const router         = inject(Router);
  const requiredRoles: string[] = route.data?.['roles'] ?? route.parent?.data?.['roles'] ?? [];

  if (requiredRoles.length === 0) return true;

  const userRole = authService.currentUser()?.role ?? '';
  if (requiredRoles.includes(userRole)) return true;

  // Rôle insuffisant → rediriger vers la bonne page d'accueil
  const user = authService.currentUser();
  if (user) {
    authService.redirectByRole(user.role);
  } else {
    router.navigate(['/home']);
  }
  return false;
};
