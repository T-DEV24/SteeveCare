// src/app/features/not-found/not-found.component.ts
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <main class="not-found-page">
      <section class="not-found-card" aria-labelledby="notFoundTitle">
        <svg class="not-found-illustration" viewBox="0 0 520 260" role="img" aria-label="Illustration 404 SteevaCare">
          <defs>
            <linearGradient id="medicalGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#0B5345" />
              <stop offset="1" stop-color="#27AE60" />
            </linearGradient>
          </defs>
          <rect x="42" y="42" width="436" height="176" rx="34" fill="rgba(255,255,255,0.94)" />
          <circle cx="130" cy="130" r="62" fill="#D5F5E3" />
          <path d="M130 88v84M88 130h84" stroke="#0B5345" stroke-width="22" stroke-linecap="round" />
          <text x="238" y="145" fill="url(#medicalGradient)" font-size="84" font-weight="800" font-family="Arial, sans-serif">404</text>
          <path d="M248 172c22 20 63 20 84 0 20-19 58-18 79 0" fill="none" stroke="#27AE60" stroke-width="8" stroke-linecap="round" opacity="0.75" />
          <circle cx="426" cy="88" r="12" fill="#27AE60" opacity="0.22" />
          <circle cx="456" cy="122" r="8" fill="#1A5276" opacity="0.18" />
        </svg>

        <p class="eyebrow">SteevaCare</p>
        <h1 id="notFoundTitle">Page introuvable</h1>
        <p class="description">
          La page demandée n'existe pas, a été déplacée ou le lien utilisé n'est plus valide.
        </p>

        <div class="actions">
          <button mat-raised-button routerLink="/home" class="primary-action">
            <mat-icon>home</mat-icon>
            Retour à l'accueil
          </button>
          <button mat-stroked-button type="button" class="secondary-action" (click)="goToDashboard()">
            <mat-icon>dashboard</mat-icon>
            Tableau de bord
          </button>
        </div>

        <p class="redirect-countdown">
          Redirection dans {{countdown()}}s...
        </p>
      </section>
    </main>
  `,
  styles: [`
    .not-found-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      background:
        radial-gradient(circle at top left, rgba(39,174,96,0.26), transparent 34%),
        linear-gradient(135deg, #1A5276, #0B5345 55%, #27AE60);
      color: white;
      text-align: center;
    }

    .not-found-card {
      width: min(100%, 640px);
      padding: 38px 34px;
      border-radius: 28px;
      background: rgba(255,255,255,0.13);
      border: 1px solid rgba(255,255,255,0.24);
      box-shadow: 0 24px 80px rgba(0,0,0,0.24);
      backdrop-filter: blur(14px);
    }

    .not-found-illustration {
      width: min(100%, 430px);
      height: auto;
      margin-bottom: 20px;
      filter: drop-shadow(0 18px 28px rgba(0,0,0,0.22));
    }

    .eyebrow {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0.76;
    }

    h1 {
      margin: 0;
      font-size: clamp(34px, 7vw, 56px);
      font-weight: 800;
      letter-spacing: -0.04em;
    }

    .description {
      max-width: 470px;
      margin: 14px auto 28px;
      color: rgba(255,255,255,0.78);
      font-size: 15px;
      line-height: 1.7;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .actions button {
      min-height: 44px;
      border-radius: 999px;
      padding: 0 22px;
      font-weight: 700;
    }

    .primary-action {
      background: white !important;
      color: #0B5345 !important;
    }

    .secondary-action {
      border-color: rgba(255,255,255,0.72) !important;
      color: white !important;
    }

    .redirect-countdown {
      margin: 0;
      color: rgba(255,255,255,0.72);
      font-size: 13px;
    }
  `]
})
export class NotFoundComponent implements OnInit, OnDestroy {
  countdown = signal(10);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      const next = this.countdown() - 1;
      this.countdown.set(Math.max(next, 0));
      if (next <= 0) {
        this.clearCountdown();
        this.router.navigateByUrl(this.auth.isLoggedIn() ? this.dashboardRoute : '/home');
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  goToDashboard(): void {
    this.clearCountdown();
    this.router.navigateByUrl(this.auth.isLoggedIn() ? this.dashboardRoute : '/auth/login');
  }

  private get dashboardRoute(): string {
    const routes: Record<string, string> = {
      PATIENT: '/patient/dashboard',
      DOCTOR: '/doctor/dashboard',
      PHARMACY: '/pharmacy/dashboard',
      ADMIN: '/admin/dashboard',
      GESTIONNAIRE: '/admin/dashboard',
      SUPER_ADMIN: '/admin/dashboard',
    };
    return routes[this.auth.userRole() ?? ''] ?? '/home';
  }

  private clearCountdown(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
