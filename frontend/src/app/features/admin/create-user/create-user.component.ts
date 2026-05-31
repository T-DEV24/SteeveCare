// src/app/features/admin/create-user/create-user.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [SidebarComponent,
    CommonModule, RouterModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div style="display:flex;min-height:100vh;">

      <!-- SIDEBAR -->
      <app-sidebar [role]="'admin'" [activeRoute]="'/admin/create-user'"></app-sidebar>

      <!-- CONTENU -->
      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <h1>Créer un compte utilisateur</h1>
        </div>

        <mat-card style="max-width:720px;padding:32px;">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <!-- Section 1 : Type de compte -->
            <div class="form-section">
              <h3>Type de compte</h3>
              <mat-form-field appearance="outline" style="width:100%;">
                <mat-label>Rôle</mat-label>
                <mat-select formControlName="role" (selectionChange)="onRoleChange($event.value)">
                  <mat-option *ngFor="let r of availableRoles" [value]="r.value">
                    <mat-icon style="font-size:16px;vertical-align:middle;margin-right:6px;">
                      {{r.icon}}
                    </mat-icon>
                    {{r.label}}
                  </mat-option>
                </mat-select>
                <mat-error>Le rôle est obligatoire</mat-error>
              </mat-form-field>
            </div>

            <!-- Section 2 : Identifiants -->
            <div class="form-section">
              <h3>Identifiants de connexion</h3>
              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;">
                <mat-label>Adresse email</mat-label>
                <input matInput formControlName="email" type="email">
                <mat-icon matSuffix style="color:#7F8C8D;">email</mat-icon>
                <mat-error *ngIf="form.get('email')?.hasError('required')">Obligatoire</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">Email invalide</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" style="width:100%;">
                <mat-label>Mot de passe temporaire</mat-label>
                <input matInput formControlName="password"
                       [type]="showPwd ? 'text' : 'password'">
                <button mat-icon-button matSuffix type="button"
                        (click)="showPwd=!showPwd">
                  <mat-icon style="color:#7F8C8D;">
                    {{showPwd?'visibility_off':'visibility'}}
                  </mat-icon>
                </button>
                <mat-error>Minimum 8 caractères</mat-error>
              </mat-form-field>
            </div>

            <!-- Section 3 : Informations personnelles -->
            <div class="form-section">
              <h3>Informations personnelles</h3>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Nom</mat-label>
                  <input matInput formControlName="nom">
                  <mat-error>Obligatoire</mat-error>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Prénom</mat-label>
                  <input matInput formControlName="prenom">
                  <mat-error>Obligatoire</mat-error>
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" style="width:100%;">
                <mat-label>Téléphone</mat-label>
                <input matInput formControlName="telephone" placeholder="6XXXXXXXX">
                <mat-icon matSuffix style="color:#7F8C8D;">phone</mat-icon>
              </mat-form-field>
            </div>

            <!-- Section 4 : Profil Médecin -->
            <div *ngIf="selectedRole === 'DOCTOR'" class="form-section"
                 style="border:1px solid #D6EAF8;border-radius:10px;
                        padding:20px;background:#EBF5FB;">
              <h3 style="color:#1A5276;">🩺 Profil Médecin</h3>
              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;">
                <mat-label>Spécialité *</mat-label>
                <mat-select formControlName="specialite">
                  <mat-option *ngFor="let s of specialites" [value]="s">{{s}}</mat-option>
                </mat-select>
                <mat-error>La spécialité est obligatoire</mat-error>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Numéro d'ordre</mat-label>
                  <input matInput formControlName="numeroOrdre" placeholder="CM-SPEC-0001">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tarif (FCFA)</mat-label>
                  <input matInput formControlName="tarif" type="number" min="0">
                  <span matSuffix style="color:#7F8C8D;padding-right:8px;">FCFA</span>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Années d'expérience</mat-label>
                  <input matInput formControlName="anneesExperience" type="number" min="0">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Ville d'exercice</mat-label>
                  <mat-select formControlName="villeMedecin">
                    <mat-option *ngFor="let v of villes" [value]="v">{{v}}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" style="width:100%;">
                <mat-label>Biographie (max 500 caractères)</mat-label>
                <textarea matInput formControlName="biographie" rows="3"
                          maxlength="500"></textarea>
                <mat-hint align="end">
                  {{form.get('biographie')?.value?.length ?? 0}}/500
                </mat-hint>
              </mat-form-field>
            </div>

            <!-- Section 5 : Profil Pharmacie -->
            <div *ngIf="selectedRole === 'PHARMACY'" class="form-section"
                 style="border:1px solid #E8DAEF;border-radius:10px;
                        padding:20px;background:#F5EEF8;">
              <h3 style="color:#6C3483;">💊 Profil Pharmacie</h3>

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px;">
                <mat-label>Nom de la pharmacie *</mat-label>
                <input matInput formControlName="nomPharmacie">
                <mat-error>Obligatoire</mat-error>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Ville</mat-label>
                  <mat-select formControlName="villePharmacie">
                    <mat-option *ngFor="let v of villes" [value]="v">{{v}}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>N° Autorisation MINSANTE</mat-label>
                  <input matInput formControlName="numeroAutorisation">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" style="width:100%;">
                <mat-label>Adresse complète</mat-label>
                <input matInput formControlName="adressePharmacie">
              </mat-form-field>
            </div>

            <!-- Bouton Créer -->
            <button mat-raised-button type="submit"
                    [disabled]="form.invalid || loading"
                    style="width:100%;padding:14px;font-size:15px;font-weight:600;
                           border-radius:10px;background:#1A5276;color:white;
                           margin-top:8px;">
              <span *ngIf="!loading" style="display:flex;align-items:center;
                                             justify-content:center;gap:8px;">
                <mat-icon>person_add</mat-icon> Créer le compte
              </span>
              <span *ngIf="loading" style="display:flex;align-items:center;
                                            justify-content:center;gap:8px;">
                <mat-progress-spinner diameter="20" mode="indeterminate"
                                      color="accent"></mat-progress-spinner>
                Création en cours...
              </span>
            </button>
          </form>
        </mat-card>
      </main>
    </div>
  `
})
export class CreateUserComponent {
  auth     = inject(AuthService);
  private api      = inject(ApiService);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading      = false;
  showPwd      = false;
  selectedRole = '';

  villes = ['Yaoundé','Douala','Bafoussam','Garoua','Bamenda',
             'Maroua','Ngaoundéré','Bertoua','Ebolowa','Kribi'];

  specialites = ['Généraliste','Cardiologue','Pédiatre','Dermatologue',
                 'Gynécologue','Ophtalmologue','Chirurgien','Neurologue',
                 'Psychiatre','Urgentiste','Interniste','Rhumatologue'];

  get availableRoles() {
    const role = this.auth.userRole();
    const all = [
      { value:'DOCTOR',       label:'Médecin',        icon:'local_hospital' },
      { value:'PHARMACY',     label:'Pharmacie',       icon:'local_pharmacy' },
      { value:'GESTIONNAIRE', label:'Gestionnaire',    icon:'manage_accounts' },
      { value:'ADMIN',        label:'Administrateur',  icon:'admin_panel_settings' },
      { value:'SUPER_ADMIN',  label:'Super Admin',     icon:'shield' },
    ];
    if (role === 'GESTIONNAIRE') return all.slice(0, 2);
    if (role === 'ADMIN')        return all.slice(0, 4);
    return all;
  }

  form = this.fb.group({
    role:              ['', Validators.required],
    email:             ['', [Validators.required, Validators.email]],
    password:          ['', [Validators.required, Validators.minLength(8)]],
    nom:               ['', Validators.required],
    prenom:            ['', Validators.required],
    telephone:         [''],
    // Doctor
    specialite:        [''],
    numeroOrdre:       [''],
    tarif:             [null as number | null],
    anneesExperience:  [null as number | null],
    villeMedecin:      [''],
    biographie:        [''],
    // Pharmacy
    nomPharmacie:      [''],
    villePharmacie:    [''],
    numeroAutorisation:[''],
    adressePharmacie:  [''],
  });

  onRoleChange(role: string): void {
    this.selectedRole = role;

    // Réinitialiser les validateurs dynamiques
    const doctorFields = ['specialite'];
    const pharmacyFields = ['nomPharmacie'];

    doctorFields.forEach(f => {
      const ctrl = this.form.get(f);
      if (role === 'DOCTOR') ctrl?.setValidators([Validators.required]);
      else ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });

    pharmacyFields.forEach(f => {
      const ctrl = this.form.get(f);
      if (role === 'PHARMACY') ctrl?.setValidators([Validators.required]);
      else ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;

    this.api.post('/api/admin/users', this.form.value).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.snackBar.open(
          `✅ Compte ${res.prenom} ${res.nom} créé avec succès !`, '✕',
          { duration: 4000, panelClass: ['snack-success'] }
        );
        this.form.reset();
        this.selectedRole = '';
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.erreur ?? 'Erreur lors de la création';
        this.snackBar.open(msg, '✕', { duration: 5000, panelClass: ['snack-error'] });
      }
    });
  }
}
