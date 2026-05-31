// src/app/features/shared/profile/profile.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService, AuthResponse } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface UserProfile extends Partial<AuthResponse> {
  telephone?: string | null;
  phone?: string | null;
  dateNaissance?: string | null;
  dateOfBirth?: string | null;
  ville?: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  preferences?: ProfilePreferences;
}

interface ProfilePreferences {
  emailNotifications: boolean;
  darkMode: boolean;
  language: 'fr' | 'en';
}

type PasswordStrength = 'Faible' | 'Moyen' | 'Fort';

@Component({
  selector: 'app-confirm-disable-account-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <mat-icon>warning</mat-icon>
      <h2 mat-dialog-title>Désactiver le compte ?</h2>
      <mat-dialog-content>
        <p>{{data.message}}</p>
        <p class="confirm-dialog__warning">Cette action limitera immédiatement l'accès à votre espace SteevaCare.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close(false)">Annuler</button>
        <button mat-raised-button color="warn" type="button" (click)="dialogRef.close(true)">
          Désactiver
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding-top: 10px; }
    .confirm-dialog > mat-icon { color: #E67E22; font-size: 42px; width: 42px; height: 42px; display: block; margin: 0 auto 8px; }
    .confirm-dialog h2 { text-align: center; color: #1A5276; font-weight: 800; }
    .confirm-dialog p { color: #566573; line-height: 1.6; margin: 0 0 8px; }
    .confirm-dialog__warning { color: #C0392B !important; font-weight: 700; }
  `]
})
export class ConfirmDisableAccountDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDisableAccountDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}
}

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  template: `
    <main class="profile-page">
      <section class="profile-hero">
        <div class="profile-hero__brand">
          <img src="assets/brand/steevacare-logo.png" alt="SteevaCare - Télémédecine pour l'Afrique">
        </div>
        <div>
          <p class="profile-kicker">Mon espace personnel</p>
          <h1>Profil & préférences</h1>
          <p>Gérez vos informations, votre sécurité et vos préférences SteevaCare.</p>
        </div>
      </section>

      <section class="profile-grid">
        <!-- Avatar -->
        <mat-card class="profile-card avatar-card">
          <div class="card-title">
            <mat-icon>account_circle</mat-icon>
            <div>
              <h2>Avatar</h2>
              <p>Photo et identité visible dans votre espace.</p>
            </div>
          </div>

          <div class="avatar-preview" [style.background]="avatarPreviewUrl ? 'transparent' : roleColor">
            <img *ngIf="avatarPreviewUrl" [src]="avatarPreviewUrl" alt="Aperçu de la photo de profil">
            <span *ngIf="!avatarPreviewUrl">{{initials}}</span>
            <div *ngIf="avatarUploading" class="avatar-loading">
              <mat-progress-spinner diameter="34" mode="indeterminate"></mat-progress-spinner>
            </div>
          </div>

          <div class="avatar-meta">
            <strong>{{displayName}}</strong>
            <span>{{roleLabel}}</span>
          </div>

          <input #avatarInput type="file" accept="image/png,image/jpeg,image/webp" hidden (change)="onAvatarSelected($event)">
          <button mat-raised-button color="primary" type="button" [disabled]="avatarUploading" (click)="avatarInput.click()">
            <mat-icon>photo_camera</mat-icon>
            Changer la photo
          </button>
          <p class="hint">PNG, JPG ou WEBP. L'image est envoyée vers <code>/api/users/avatar</code>.</p>
        </mat-card>

        <!-- Informations personnelles -->
        <mat-card class="profile-card personal-card">
          <div class="card-title card-title--with-action">
            <div>
              <mat-icon>badge</mat-icon>
              <div>
                <h2>Informations personnelles</h2>
                <p>Mettez à jour vos coordonnées principales.</p>
              </div>
            </div>
            <button mat-stroked-button color="primary" type="button" [disabled]="personalSaving" (click)="togglePersonalEdit()">
              {{personalEditMode ? 'Annuler' : 'Modifier'}}
            </button>
          </div>

          <form class="profile-form" [formGroup]="personalForm" (ngSubmit)="savePersonalInfo()">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Prénom</mat-label>
                <input matInput formControlName="prenom" autocomplete="given-name">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nom</mat-label>
                <input matInput formControlName="nom" autocomplete="family-name">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" readonly autocomplete="email">
                <mat-icon matSuffix>lock</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="telephone" autocomplete="tel" placeholder="+237 6XX XXX XXX">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Date de naissance</mat-label>
                <input matInput type="date" formControlName="dateNaissance">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Ville</mat-label>
                <input matInput formControlName="ville" autocomplete="address-level2" placeholder="Yaoundé">
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="!personalEditMode || personalSaving || personalForm.invalid">
                <mat-progress-spinner *ngIf="personalSaving" diameter="18" mode="indeterminate"></mat-progress-spinner>
                <mat-icon *ngIf="!personalSaving">save</mat-icon>
                Sauvegarder
              </button>
            </div>
          </form>
        </mat-card>

        <!-- Sécurité -->
        <mat-card class="profile-card security-card">
          <div class="card-title">
            <mat-icon>shield</mat-icon>
            <div>
              <h2>Sécurité</h2>
              <p>Changez votre mot de passe ou désactivez votre compte.</p>
            </div>
          </div>

          <form class="profile-form" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <mat-form-field appearance="outline">
              <mat-label>Ancien mot de passe</mat-label>
              <input matInput type="password" formControlName="oldPassword" autocomplete="current-password">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nouveau mot de passe</mat-label>
              <input matInput type="password" formControlName="newPassword" autocomplete="new-password">
            </mat-form-field>

            <div class="strength-block" *ngIf="passwordForm.get('newPassword')?.value">
              <div class="strength-track">
                <span [style.width.%]="passwordStrengthPercent" [style.background]="passwordStrengthColor"></span>
              </div>
              <p [style.color]="passwordStrengthColor">Force : {{passwordStrength}}</p>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Confirmation</mat-label>
              <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password">
              <mat-error *ngIf="passwordForm.hasError('passwordMismatch')">Les mots de passe ne correspondent pas</mat-error>
            </mat-form-field>

            <div class="security-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="passwordSaving || passwordForm.invalid">
                <mat-progress-spinner *ngIf="passwordSaving" diameter="18" mode="indeterminate"></mat-progress-spinner>
                <mat-icon *ngIf="!passwordSaving">lock_reset</mat-icon>
                Changer le mot de passe
              </button>

              <button mat-stroked-button color="warn" type="button" [disabled]="accountDisabling" (click)="confirmDisableAccount()">
                <mat-progress-spinner *ngIf="accountDisabling" diameter="18" mode="indeterminate"></mat-progress-spinner>
                <mat-icon *ngIf="!accountDisabling">person_off</mat-icon>
                Désactiver le compte
              </button>
            </div>
          </form>
        </mat-card>

        <!-- Préférences -->
        <mat-card class="profile-card preferences-card">
          <div class="card-title">
            <mat-icon>tune</mat-icon>
            <div>
              <h2>Préférences</h2>
              <p>Personnalisez votre expérience utilisateur.</p>
            </div>
          </div>

          <form class="preferences-form" [formGroup]="preferencesForm" (ngSubmit)="savePreferences()">
            <mat-slide-toggle formControlName="emailNotifications">
              Recevoir les notifications email
            </mat-slide-toggle>

            <mat-slide-toggle formControlName="darkMode">
              Mode sombre <span class="hint-inline">(bientôt disponible)</span>
            </mat-slide-toggle>

            <mat-form-field appearance="outline">
              <mat-label>Langue</mat-label>
              <mat-select formControlName="language">
                <mat-option value="fr">Français</mat-option>
                <mat-option value="en">English</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="preferencesSaving || preferencesForm.invalid">
              <mat-progress-spinner *ngIf="preferencesSaving" diameter="18" mode="indeterminate"></mat-progress-spinner>
              <mat-icon *ngIf="!preferencesSaving">check_circle</mat-icon>
              Enregistrer les préférences
            </button>
          </form>
        </mat-card>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #F4F8FB; }
    .profile-page { padding: 32px; max-width: 1220px; margin: 0 auto; }
    .profile-hero { display: flex; align-items: center; gap: 24px; padding: 28px; margin-bottom: 24px; border-radius: 28px; color: white; background: linear-gradient(135deg,#0D3349,#1A5276 48%,#1E8449); box-shadow: 0 18px 54px rgba(13,51,73,0.16); }
    .profile-hero__brand { width: 180px; flex: 0 0 auto; padding: 10px 14px; border-radius: 20px; background: rgba(255,255,255,0.96); box-shadow: 0 14px 34px rgba(0,0,0,0.18); }
    .profile-hero__brand img { display: block; width: 100%; height: auto; }
    .profile-kicker { margin: 0 0 6px; color: #8EF2B3; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .profile-hero h1 { margin: 0 0 8px; font-size: clamp(2rem,4vw,3.4rem); font-weight: 900; letter-spacing: -1px; }
    .profile-hero p:last-child { margin: 0; color: rgba(255,255,255,0.82); line-height: 1.6; }
    .profile-grid { display: grid; grid-template-columns: minmax(280px, 360px) 1fr; gap: 24px; align-items: start; }
    .profile-card { border-radius: 24px !important; padding: 26px; border: 1px solid rgba(26,82,118,0.08); box-shadow: 0 14px 44px rgba(13,51,73,0.08) !important; }
    .personal-card { grid-column: 2; grid-row: 1 / span 2; }
    .security-card, .preferences-card { grid-column: span 1; }
    .card-title { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 22px; }
    .card-title > mat-icon { width: 44px; height: 44px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 14px; color: #1A5276; background: #E8F4FB; font-size: 26px; }
    .card-title h2 { margin: 0 0 4px; color: #173B52; font-size: 21px; font-weight: 900; }
    .card-title p { margin: 0; color: #7A8792; line-height: 1.5; font-size: 13px; }
    .card-title--with-action { justify-content: space-between; gap: 18px; }
    .card-title--with-action > div { display: flex; align-items: flex-start; gap: 14px; }
    .avatar-card { text-align: center; }
    .avatar-preview { width: 146px; height: 146px; position: relative; display: grid; place-items: center; margin: 8px auto 18px; overflow: hidden; border-radius: 50%; color: white; font-size: 42px; font-weight: 900; box-shadow: 0 18px 40px rgba(13,51,73,0.18); }
    .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-loading { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(255,255,255,0.72); }
    .avatar-meta { display: flex; flex-direction: column; gap: 4px; margin-bottom: 18px; }
    .avatar-meta strong { color: #173B52; font-size: 20px; }
    .avatar-meta span { color: #6D7D88; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .hint, .hint-inline { color: #7A8792; font-size: 12px; line-height: 1.5; }
    .hint code { color: #1A5276; font-weight: 800; }
    .profile-form, .preferences-form { display: flex; flex-direction: column; gap: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .form-actions, .security-actions { display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap; }
    button mat-progress-spinner { display: inline-block; margin-right: 8px; vertical-align: middle; }
    button mat-icon { margin-right: 8px; vertical-align: middle; }
    .strength-block { margin: -6px 0 2px; }
    .strength-track { height: 8px; overflow: hidden; border-radius: 999px; background: #E8EEF3; }
    .strength-track span { display: block; height: 100%; border-radius: inherit; transition: width 0.2s ease, background 0.2s ease; }
    .strength-block p { margin: 6px 0 0; font-size: 12px; font-weight: 800; }
    .preferences-form mat-slide-toggle { padding: 10px 0; }
    @media (max-width: 980px) {
      .profile-grid { grid-template-columns: 1fr; }
      .personal-card, .security-card, .preferences-card { grid-column: auto; grid-row: auto; }
    }
    @media (max-width: 680px) {
      .profile-page { padding: 18px; }
      .profile-hero { flex-direction: column; align-items: flex-start; padding: 22px; }
      .profile-hero__brand { width: 160px; }
      .form-grid { grid-template-columns: 1fr; }
      .card-title--with-action { flex-direction: column; }
      .form-actions, .security-actions { justify-content: stretch; }
      .form-actions button, .security-actions button, .preferences-form button { width: 100%; }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  avatarPreviewUrl: string | null = null;
  avatarUploading = false;
  personalEditMode = false;
  personalSaving = false;
  passwordSaving = false;
  preferencesSaving = false;
  accountDisabling = false;

  private profileSnapshot: UserProfile = {};

  readonly personalForm = this.fb.group({
    prenom: ['', [Validators.required, Validators.maxLength(80)]],
    nom: ['', [Validators.required, Validators.maxLength(80)]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    telephone: ['', [Validators.maxLength(30)]],
    dateNaissance: [''],
    ville: ['', [Validators.maxLength(120)]]
  });

  readonly passwordForm = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordsMatchValidator });

  readonly preferencesForm = this.fb.group({
    emailNotifications: [true],
    darkMode: [false],
    language: ['fr' as 'fr' | 'en']
  });

  ngOnInit(): void {
    this.personalForm.disable({ emitEvent: false });
    this.patchFromUser(this.auth.currentUser());
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get displayName(): string {
    const prenom = this.personalForm.get('prenom')?.value ?? '';
    const nom = this.personalForm.get('nom')?.value ?? '';
    return `${prenom} ${nom}`.trim() || 'Utilisateur SteevaCare';
  }

  get initials(): string {
    const prenom = this.personalForm.get('prenom')?.value?.trim()?.[0] ?? '';
    const nom = this.personalForm.get('nom')?.value?.trim()?.[0] ?? '';
    const email = this.personalForm.getRawValue().email?.trim()?.[0] ?? 'S';
    return `${prenom}${nom}`.trim().toUpperCase() || email.toUpperCase();
  }

  get roleLabel(): string {
    const role = this.auth.userRole() ?? this.profileSnapshot.role ?? '';
    const labels: Record<string, string> = {
      PATIENT: 'Patient',
      DOCTOR: 'Médecin',
      PHARMACY: 'Pharmacie',
      ADMIN: 'Administrateur',
      GESTIONNAIRE: 'Gestionnaire',
      SUPER_ADMIN: 'Super administrateur'
    };
    return labels[role] ?? 'Compte utilisateur';
  }

  get roleColor(): string {
    const role = this.auth.userRole() ?? this.profileSnapshot.role ?? '';
    const colors: Record<string, string> = {
      PATIENT: 'linear-gradient(135deg,#1A5276,#27AE60)',
      DOCTOR: 'linear-gradient(135deg,#0B5345,#27AE60)',
      PHARMACY: 'linear-gradient(135deg,#6C3483,#8E44AD)',
      ADMIN: 'linear-gradient(135deg,#1A5276,#2E86C1)',
      GESTIONNAIRE: 'linear-gradient(135deg,#1A5276,#2E86C1)',
      SUPER_ADMIN: 'linear-gradient(135deg,#1A5276,#2E86C1)'
    };
    return colors[role] ?? 'linear-gradient(135deg,#1A5276,#27AE60)';
  }

  get passwordStrength(): PasswordStrength {
    const password = this.passwordForm.get('newPassword')?.value ?? '';
    const score = this.passwordScore(password);
    if (score >= 4) return 'Fort';
    if (score >= 2) return 'Moyen';
    return 'Faible';
  }

  get passwordStrengthPercent(): number {
    return this.passwordStrength === 'Fort' ? 100 : this.passwordStrength === 'Moyen' ? 66 : 33;
  }

  get passwordStrengthColor(): string {
    return this.passwordStrength === 'Fort' ? '#27AE60' : this.passwordStrength === 'Moyen' ? '#F39C12' : '#E74C3C';
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notification.error('Veuillez choisir une image valide.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreviewUrl = String(reader.result);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('avatar', file);
    this.avatarUploading = true;

    this.api.post<{ avatarUrl?: string }>('/api/users/avatar', formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.avatarUploading = false;
          if (res.avatarUrl) this.avatarPreviewUrl = res.avatarUrl;
          this.notification.success('Photo de profil mise à jour.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.avatarUploading = false;
          this.notification.error(err.error?.message ?? err.error?.erreur ?? 'Impossible de mettre à jour la photo.');
          this.cdr.markForCheck();
        }
      });
  }

  togglePersonalEdit(): void {
    this.personalEditMode = !this.personalEditMode;
    if (this.personalEditMode) {
      this.personalForm.enable({ emitEvent: false });
      this.personalForm.get('email')?.disable({ emitEvent: false });
    } else {
      this.patchPersonalForm(this.profileSnapshot);
      this.personalForm.disable({ emitEvent: false });
    }
  }

  savePersonalInfo(): void {
    if (this.personalForm.invalid || !this.personalEditMode || this.personalSaving) return;

    this.personalSaving = true;
    const formValue = this.personalForm.getRawValue();
    const payload = {
      prenom: formValue.prenom ?? '',
      nom: formValue.nom ?? '',
      email: formValue.email ?? '',
      telephone: formValue.telephone ?? '',
      dateNaissance: formValue.dateNaissance ?? '',
      ville: formValue.ville ?? ''
    };
    this.api.put<UserProfile>('/api/users/profile', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.personalSaving = false;
          this.personalEditMode = false;
          this.profileSnapshot = { ...this.profileSnapshot, ...profile, ...payload };
          this.patchPersonalForm(this.profileSnapshot);
          this.personalForm.disable({ emitEvent: false });
          this.notification.success('Profil mis à jour avec succès.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.personalSaving = false;
          this.notification.error(err.error?.message ?? err.error?.erreur ?? 'Impossible de sauvegarder le profil.');
          this.cdr.markForCheck();
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.passwordSaving) return;

    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    this.passwordSaving = true;
    this.api.post('/api/users/password', { oldPassword, newPassword })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.passwordSaving = false;
          this.passwordForm.reset();
          this.notification.success('Mot de passe modifié avec succès.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.passwordSaving = false;
          this.notification.error(err.error?.message ?? err.error?.erreur ?? 'Impossible de changer le mot de passe.');
          this.cdr.markForCheck();
        }
      });
  }

  confirmDisableAccount(): void {
    const ref = this.dialog.open(ConfirmDisableAccountDialogComponent, {
      width: '420px',
      data: { message: 'Voulez-vous vraiment désactiver votre compte ?' }
    });

    ref.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) this.disableAccount();
      });
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid || this.preferencesSaving) return;

    const preferences = this.preferencesForm.getRawValue() as ProfilePreferences;
    this.preferencesSaving = true;
    this.api.put<ProfilePreferences>('/api/users/preferences', preferences)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.preferencesSaving = false;
          this.notification.success('Préférences enregistrées.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.preferencesSaving = false;
          this.notification.error(err.error?.message ?? err.error?.erreur ?? 'Impossible de sauvegarder les préférences.');
          this.cdr.markForCheck();
        }
      });
  }

  private loadProfile(): void {
    this.api.get<UserProfile>('/api/users/me')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profileSnapshot = { ...this.profileSnapshot, ...profile };
          this.patchPersonalForm(this.profileSnapshot);
          this.avatarPreviewUrl = profile.avatarUrl ?? this.avatarPreviewUrl;
          if (profile.preferences) this.preferencesForm.patchValue(profile.preferences, { emitEvent: false });
          if (!this.personalEditMode) this.personalForm.disable({ emitEvent: false });
          this.cdr.markForCheck();
        },
        error: () => {
          // Les données du token restent suffisantes pour afficher la page profil.
          this.cdr.markForCheck();
        }
      });
  }

  private patchFromUser(user: AuthResponse | null): void {
    if (!user) return;
    this.profileSnapshot = { ...this.profileSnapshot, ...user };
    this.patchPersonalForm(this.profileSnapshot);
  }

  private patchPersonalForm(profile: UserProfile): void {
    this.personalForm.patchValue({
      prenom: profile.prenom ?? '',
      nom: profile.nom ?? '',
      email: profile.email ?? '',
      telephone: profile.telephone ?? profile.phone ?? '',
      dateNaissance: profile.dateNaissance ?? profile.dateOfBirth ?? '',
      ville: profile.ville ?? profile.city ?? ''
    }, { emitEvent: false });
  }

  private disableAccount(): void {
    this.accountDisabling = true;
    this.api.patch('/api/users/me/deactivate')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.accountDisabling = false;
          this.notification.success('Compte désactivé.');
          this.auth.logout();
        },
        error: (err) => {
          this.accountDisabling = false;
          this.notification.error(err.error?.message ?? err.error?.erreur ?? 'Impossible de désactiver le compte.');
          this.cdr.markForCheck();
        }
      });
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword !== confirmPassword ? { passwordMismatch: true } : null;
  }

  private passwordScore(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }
}
