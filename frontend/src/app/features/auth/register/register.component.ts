// src/app/features/auth/register/register.component.ts
import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService, AuthResponse } from '../../../core/services/auth.service';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pass    = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                background:linear-gradient(135deg,#1A5276 0%,#27AE60 100%);padding:24px;">
      <div style="background:white;border-radius:20px;padding:44px 40px;
                  width:100%;max-width:600px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">

        <!-- Logo -->
        <div style="text-align:center;margin-bottom:28px;">
          <img src="assets/brand/steevacare-logo.svg"
               alt="SteevaCare - Télémédecine pour l'Afrique"
               style="display:block;width:190px;max-width:78%;height:auto;margin:0 auto 12px;">
          <h1 style="font-size:22px;font-weight:700;color:#1A5276;margin:0;">
            Créer mon compte
          </h1>
          <p style="color:#7F8C8D;font-size:13px;margin-top:4px;">
            Rejoignez SteevaCare gratuitement
          </p>
        </div>

        <!-- STEPPER -->
        <mat-stepper linear #stepper [selectedIndex]="selectedIndex" animationDuration="300ms" labelPosition="bottom">

          <!-- ═══ ÉTAPE 1 : Identifiants ═══ -->
          <mat-step [stepControl]="step1">
            <ng-template matStepLabel>Identifiants</ng-template>
            <form [formGroup]="step1" style="padding-top:20px;">

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;" floatLabel="always" subscriptSizing="dynamic">
                <mat-label>Adresse email</mat-label>
                <input matInput formControlName="email" type="email"
                       placeholder="vous@exemple.cm">
                <mat-icon matSuffix style="color:#7F8C8D;">email</mat-icon>
                <mat-error *ngIf="step1.get('email')?.hasError('required')">
                  L'email est obligatoire
                </mat-error>
                <mat-error *ngIf="step1.get('email')?.hasError('email')">
                  Format d'email invalide
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;" floatLabel="always" subscriptSizing="dynamic">
                <mat-label>Mot de passe</mat-label>
                <input matInput formControlName="password"
                       [type]="showPwd ? 'text' : 'password'">
                <button mat-icon-button matSuffix type="button"
                        [attr.aria-label]="showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                        (click)="showPwd=!showPwd">
                  <mat-icon style="color:#7F8C8D;">
                    {{showPwd?'visibility_off':'visibility'}}
                  </mat-icon>
                </button>
                <mat-error *ngIf="step1.get('password')?.hasError('required')">
                  Obligatoire
                </mat-error>
                <mat-error *ngIf="step1.get('password')?.hasError('minlength')">
                  Minimum 8 caractères
                </mat-error>
              </mat-form-field>

              <!-- Indicateur force mot de passe -->
              <div *ngIf="step1.get('password')?.value"
                   style="margin-bottom:12px;">
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                  <div *ngFor="let b of [0,1,2]; trackBy: trackByItem"
                       [style.background]="passwordStrength > b ? strengthColor : '#EEF0F4'"
                       style="flex:1;height:4px;border-radius:2px;
                              transition:background 0.3s;"></div>
                </div>
                <span [style.color]="strengthColor" style="font-size:11px;font-weight:500;">
                  {{strengthLabel}}
                </span>
              </div>

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;" floatLabel="always" subscriptSizing="dynamic">
                <mat-label>Confirmer le mot de passe</mat-label>
                <input matInput formControlName="confirmPassword"
                       [type]="showConfirm ? 'text' : 'password'">
                <button mat-icon-button matSuffix type="button"
                        [attr.aria-label]="showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'"
                        (click)="showConfirm=!showConfirm">
                  <mat-icon style="color:#7F8C8D;">
                    {{showConfirm?'visibility_off':'visibility'}}
                  </mat-icon>
                </button>
                <mat-error *ngIf="form.hasError('passwordMismatch')">
                  Les mots de passe ne correspondent pas
                </mat-error>
              </mat-form-field>

              <div style="display:flex;justify-content:flex-end;margin-top:8px;">
                <button mat-raised-button matStepperNext type="button"
                        [disabled]="step1.invalid"
                        style="background:#1A5276;color:white;border-radius:8px;">
                  Suivant <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- ═══ ÉTAPE 2 : Informations personnelles ═══ -->
          <mat-step [stepControl]="step2">
            <ng-template matStepLabel>Informations</ng-template>
            <form [formGroup]="step2" style="padding-top:20px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                  <mat-label>Nom</mat-label>
                  <input matInput formControlName="nom">
                  <mat-error>Obligatoire</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                  <mat-label>Prénom</mat-label>
                  <input matInput formControlName="prenom">
                  <mat-error>Obligatoire</mat-error>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;" floatLabel="always" subscriptSizing="dynamic">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="telephone"
                       placeholder="6XXXXXXXX ou 2XXXXXXXXX">
                <mat-icon matSuffix style="color:#7F8C8D;">phone</mat-icon>
                <mat-error *ngIf="step2.get('telephone')?.hasError('required')">
                  Obligatoire
                </mat-error>
                <mat-error *ngIf="step2.get('telephone')?.hasError('pattern')">
                  Numéro camerounais 9 chiffres requis
                </mat-error>
              </mat-form-field>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                  <mat-label>Ville</mat-label>
                  <mat-select formControlName="ville">
                    <mat-option *ngFor="let v of villes; trackBy: trackByItem" [value]="v">{{v}}</mat-option>
                  </mat-select>
                  <mat-error>Obligatoire</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                  <mat-label>Sexe</mat-label>
                  <mat-select formControlName="sexe">
                    <mat-option value="Masculin">Masculin</mat-option>
                    <mat-option value="Féminin">Féminin</mat-option>
                  </mat-select>
                  <mat-error>Obligatoire</mat-error>
                </mat-form-field>
              </div>

              <div style="display:flex;justify-content:space-between;margin-top:8px;">
                <button mat-stroked-button matStepperPrevious type="button"
                        style="border-radius:8px;">
                  <mat-icon>arrow_back</mat-icon> Retour
                </button>
                <button mat-raised-button matStepperNext type="button"
                        [disabled]="step2.invalid"
                        style="background:#1A5276;color:white;border-radius:8px;">
                  Suivant <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- ═══ ÉTAPE 3 : Récapitulatif ═══ -->
          <mat-step>
            <ng-template matStepLabel>Confirmation</ng-template>
            <div style="padding-top:20px;">
              <h3 style="font-size:15px;font-weight:600;color:#1A5276;margin-bottom:16px;">
                ✅ Vérifiez vos informations
              </h3>
              <div style="background:#F5F6FA;border-radius:10px;padding:20px;
                          display:grid;gap:10px;">
                <div *ngFor="let row of recap; trackBy: trackByItem" style="display:flex;gap:8px;">
                  <span style="color:#7F8C8D;font-size:13px;min-width:100px;">
                    {{row.label}} :
                  </span>
                  <strong style="font-size:13px;color:#2C3E50;">{{row.value}}</strong>
                </div>
              </div>

              <div style="display:flex;justify-content:space-between;margin-top:20px;">
                <button mat-stroked-button matStepperPrevious type="button"
                        style="border-radius:8px;">
                  <mat-icon>arrow_back</mat-icon> Retour
                </button>
                <button mat-raised-button type="button"
                        [disabled]="loading"
                        (click)="onSubmit()"
                        style="background:#27AE60;color:white;
                               border-radius:8px;padding:0 24px;">
                  <span *ngIf="!loading" style="display:flex;align-items:center;gap:6px;">
                    <mat-icon>check_circle</mat-icon> Créer mon compte
                  </span>
                  <span *ngIf="loading" style="display:flex;align-items:center;gap:8px;">
                    <mat-progress-spinner diameter="18" mode="indeterminate"
                                          color="accent"></mat-progress-spinner>
                    Création...
                  </span>
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>

        <!-- Lien connexion -->
        <p style="text-align:center;margin-top:20px;color:#7F8C8D;font-size:13px;">
          Déjà un compte ?
          <a routerLink="/auth/login"
             style="color:#1A5276;font-weight:600;cursor:pointer;">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private fb          = inject(FormBuilder);
  private api         = inject(ApiService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  loading      = false;
  showPwd      = false;
  showConfirm  = false;
  selectedIndex = 0;

  villes = ['Yaoundé','Douala','Bafoussam','Garoua','Bamenda',
             'Maroua','Ngaoundéré','Bertoua','Ebolowa','Kribi'];

  step1 = this.fb.group({
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  get form() {
    return this.step1;
  }

  step2 = this.fb.group({
    nom:       ['', Validators.required],
    prenom:    ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    ville:     ['', Validators.required],
    sexe:      ['', Validators.required]
  });

  get passwordStrength(): number {
    const pwd = this.step1.get('password')?.value ?? '';
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }
  get strengthLabel(): string {
    return ['', 'Faible', 'Moyen', 'Fort'][this.passwordStrength];
  }
  get strengthColor(): string {
    return ['', '#E74C3C', '#F39C12', '#27AE60'][this.passwordStrength];
  }

  get recap() {
    return [
      { label: 'Email',     value: this.step1.get('email')?.value },
      { label: 'Nom',       value: this.step2.get('nom')?.value },
      { label: 'Prénom',    value: this.step2.get('prenom')?.value },
      { label: 'Téléphone', value: this.step2.get('telephone')?.value },
      { label: 'Ville',     value: this.step2.get('ville')?.value },
      { label: 'Sexe',      value: this.step2.get('sexe')?.value },
    ];
  }

  onSubmit(): void {
    if (this.step1.invalid || this.step2.invalid || this.loading) return;
    this.loading = true;

    const body = {
      email:     this.step1.get('email')?.value,
      password:  this.step1.get('password')?.value,
      nom:       this.step2.get('nom')?.value,
      prenom:    this.step2.get('prenom')?.value,
      telephone: this.step2.get('telephone')?.value,
      ville:     this.step2.get('ville')?.value,
      sexe:      this.step2.get('sexe')?.value
    };

    this.api.post<AuthResponse>('/api/auth/register', body).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        this.notification.success('Compte créé avec succès ! Bienvenue 🎉', 3000);
        this.authService.register(res);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.erreur ?? 'Erreur lors de la création du compte';
        this.notification.error(msg, 5000);
      }
    });
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
