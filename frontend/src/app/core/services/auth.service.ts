// src/app/core/services/auth.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthResponse {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  status: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'steevacare_user';
  private readonly router = inject(Router);

  private _currentUser = signal<AuthResponse | null>(null);

  // Propriétés publiques réactives
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._currentUser());
  readonly token       = computed(() => this._currentUser()?.accessToken ?? null);
  readonly userRole    = computed(() => this._currentUser()?.role ?? null);

  constructor() {
    // Restaurer la session depuis localStorage au démarrage
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: AuthResponse = JSON.parse(stored);
        if (parsed?.accessToken && !this.isTokenExpired(parsed.accessToken)) {
          this._currentUser.set(parsed);
        } else {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /** Connexion : stocke la réponse seulement si le JWT n'est pas expiré. */
  login(response: AuthResponse): void {
    if (this.isTokenExpired(response.accessToken)) {
      localStorage.removeItem(this.STORAGE_KEY);
      this._currentUser.set(null);
      this.router.navigate(['/auth/login']);
      return;
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response));
    this._currentUser.set(response);

    const returnUrl = this.getSafeReturnUrl();
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    this.redirectByRole(response.role);
  }

  /** Inscription : même comportement que login */
  register(response: AuthResponse): void {
    this.login(response);
  }

  /** Déconnexion : supprime systématiquement le JWT persistant. */
  logout(redirectToLogin = true): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._currentUser.set(null);

    if (redirectToLogin) {
      this.router.navigate(['/auth/login']);
    }
  }

  /** Vérifie l'expiration du JWT à partir du claim exp (en secondes). */
  isTokenExpired(token: string | null = this.token()): boolean {
    if (!token) return true;

    const payload = this.decodeJwtPayload(token);
    if (!payload?.exp) return true;

    return payload.exp <= Date.now() / 1000;
  }

  private decodeJwtPayload(token: string): { exp?: number } | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  /** Vérifie si l'utilisateur possède l'un des rôles fournis */
  hasRole(...roles: string[]): boolean {
    const userRole = this._currentUser()?.role;
    if (!userRole) return false;
    return roles.includes(userRole);
  }

  private getSafeReturnUrl(): string | null {
    const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
    return typeof returnUrl === 'string' && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : null;
  }

  /** Redirection selon le rôle */
  redirectByRole(role: string): void {
    const routes: Record<string, string> = {
      PATIENT:      '/patient/dashboard',
      DOCTOR:       '/doctor/dashboard',
      PHARMACY:     '/pharmacy/dashboard',
      ADMIN:        '/admin/dashboard',
      GESTIONNAIRE: '/admin/dashboard',
      SUPER_ADMIN:  '/admin/dashboard',
    };
    this.router.navigate([routes[role] ?? '/home']);
  }

  /** Raccourcis pratiques */
  get prenom(): string { return this._currentUser()?.prenom ?? ''; }
  get nom():    string { return this._currentUser()?.nom ?? ''; }
  get userId(): number | null { return this._currentUser()?.id ?? null; }
}
