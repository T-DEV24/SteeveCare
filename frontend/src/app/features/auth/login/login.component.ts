// src/app/features/auth/login/login.component.ts
import { Component, OnDestroy, inject, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService, AuthResponse } from '../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                background:linear-gradient(135deg,#1A5276 0%,#27AE60 100%);padding:20px;">
      <div class="login-card" [class.shake]="loginError"
           style="background:white;border-radius:20px;padding:44px 40px;
                  width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">

        <!-- Logo -->
        <div style="text-align:center;margin-bottom:32px;">
          <img src="assets/brand/steevacare-logo.png"
               alt="SteevaCare - Télémédecine pour l'Afrique"
               style="display:block;width:180px;max-width:78%;height:auto;margin:0 auto 12px;">
          <p style="color:#7F8C8D;font-size:14px;margin-top:4px;">Accédez à votre espace santé</p>
        </div>

        <!-- Formulaire -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Email -->
          <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;" floatLabel="always" subscriptSizing="dynamic">
            <mat-label>Adresse email</mat-label>
            <input matInput formControlName="email" type="email"
                   placeholder="vous@exemple.cm" autocomplete="email">
            <mat-icon matSuffix style="color:#7F8C8D;">email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">
              L'email est obligatoire
            </mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">
              Format d'email invalide
            </mat-error>
          </mat-form-field>

          <!-- Mot de passe -->
          <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;" floatLabel="always" subscriptSizing="dynamic">
            <mat-label>Mot de passe</mat-label>
            <input matInput formControlName="password"
                   [type]="showPassword ? 'text' : 'password'"
                   autocomplete="current-password">
            <button mat-icon-button matSuffix type="button"
                    (click)="showPassword = !showPassword"
                    [attr.aria-label]="showPassword ? 'Masquer' : 'Afficher'">
              <mat-icon style="color:#7F8C8D;">
                {{showPassword ? 'visibility_off' : 'visibility'}}
              </mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">
              Le mot de passe est obligatoire
            </mat-error>
            <mat-error *ngIf="form.get('password')?.hasError('minlength')">
              Minimum 8 caractères
            </mat-error>
          </mat-form-field>

          <!-- Bouton connexion -->
          <button mat-raised-button type="submit"
                  [disabled]="loginForm.invalid || loading"
                  style="width:100%;margin-top:16px;padding:14px;font-size:16px;
                         font-weight:600;border-radius:10px;background:#1A5276;
                         color:white;">
            <span *ngIf="!loading">Se connecter</span>
            <span *ngIf="loading" style="display:flex;align-items:center;
                                          justify-content:center;gap:8px;">
              <mat-progress-spinner diameter="20" mode="indeterminate"
                                    color="accent"></mat-progress-spinner>
              Connexion en cours...
            </span>
          </button>
        </form>

        <!-- Lien inscription -->
        <p style="text-align:center;margin-top:24px;color:#7F8C8D;font-size:14px;">
          Pas encore de compte ?
          <a routerLink="/auth/register"
             style="color:#1A5276;font-weight:600;cursor:pointer;">
            S'inscrire gratuitement
          </a>
        </p>

        <!-- Comptes de démonstration -->
        <details *ngIf="showDemoAccounts"
                 style="margin-top:20px;border:1px solid #EEF0F4;
                        border-radius:8px;padding:12px;">
          <summary style="cursor:pointer;font-size:12px;color:#7F8C8D;font-weight:500;">
            🔑 Comptes de démonstration
          </summary>
          <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
            <div *ngFor="let demo of demoAccounts; trackBy: trackByItem"
                 (click)="fillDemo(demo)"
                 style="cursor:pointer;padding:8px 10px;border-radius:6px;
                        background:#F5F6FA;font-size:12px;display:flex;
                        align-items:center;justify-content:space-between;"
                 onmouseenter="this.style.background='#EEF0F4'"
                 onmouseleave="this.style.background='#F5F6FA'">
              <span>
                <strong [style.color]="demo.color">{{demo.role}}</strong>
                — {{demo.email}}
              </span>
              <mat-icon style="font-size:14px;color:#BDC3C7;">login</mat-icon>
            </div>
          </div>
        </details>
      </div>
    </div>
  `,
  styles: [`
    .login-card {
      animation: fadeIn 0.45s ease-out both;
    }

    .login-card.shake {
      animation: shake 0.42s ease-in-out both;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(18px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }
  `]
})
export class LoginComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private fb          = inject(FormBuilder);
  private api         = inject(ApiService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  loading      = false;
  showPassword = false;
  loginError   = false;
  readonly isProduction = !isDevMode();
  readonly showDemoAccounts = !this.isProduction;

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  get loginForm() {
    return this.form;
  }

  demoAccounts = this.showDemoAccounts ? [
    { role: 'Super Admin', email: 'superadmin@steevacare.cm', password: 'Admin@12345',   color: '#922B21' },
    { role: 'Admin',       email: 'admin@steevacare.cm',      password: 'Admin@12345',   color: '#A04000' },
    { role: 'Médecin',     email: 'dr.martin@steevacare.cm',  password: 'Doctor@12345',  color: '#1A5276' },
    { role: 'Pharmacie',   email: 'pharma.centrale@steevacare.cm', password: 'Pharma@12345', color: '#6C3483' },
    { role: 'Patient',     email: 'patient@steevacare.cm',    password: 'Patient@12345', color: '#1E8449' },
  ] : [];

  fillDemo(demo: { email: string; password: string }) {
    this.form.setValue({ email: demo.email, password: demo.password });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.loginError = false;

    this.api.post<AuthResponse>('/api/auth/login', this.form.value)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.loading = false;
          this.authService.login(res);
        },
        error: (err) => {
          this.loading = false;
          this.loginError = true;
          setTimeout(() => { this.loginError = false; }, 450);
          this.notification.error(this.getErrorMessage(err, 'Email ou mot de passe incorrect'), 5000);
        }
      });
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (err?.status === 0) {
      return 'Impossible de joindre le serveur SteevaCare. Vérifiez que le backend est démarré sur le port 8082.';
    }

    if (typeof err?.error === 'string') {
      return err.error;
    }

    return err?.error?.erreur
      ?? err?.error?.message
      ?? err?.message
      ?? fallback;
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
