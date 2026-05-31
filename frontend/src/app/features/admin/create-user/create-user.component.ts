// src/app/features/admin/create-user/create-user.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule, RouterModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatStepperModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'admin'" [activeRoute]="'/admin/create-user'"></app-sidebar>

      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <h1>Créer un compte utilisateur</h1>
        </div>

        <mat-card style="max-width:820px;padding:32px;">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-stepper #stepper
                         [selectedIndex]="selectedIndex"
                         animationDuration="300ms"
                         labelPosition="bottom">

              <!-- Type -->
              <mat-step [completed]="isTypeStepValid">
                <ng-template matStepLabel>Type</ng-template>
                <div class="form-section" style="padding-top:20px;">
                  <h3>Type de compte</h3>
                  <mat-form-field appearance="outline" floatLabel="always"
                                  subscriptSizing="dynamic" style="width:100%;">
                    <mat-label>Rôle</mat-label>
                    <mat-select formControlName="role" (selectionChange)="onRoleChange($event.value)">
                      <mat-option *ngFor="let r of availableRoles; trackBy: trackByItem" [value]="r.value">
                        <mat-icon style="font-size:16px;vertical-align:middle;margin-right:6px;">
                          {{r.icon}}
                        </mat-icon>
                        {{r.label}}
                      </mat-option>
                    </mat-select>
                    <mat-error>Le rôle est obligatoire</mat-error>
                  </mat-form-field>
                </div>

                <div style="display:flex;justify-content:flex-end;margin-top:16px;">
                  <button mat-raised-button type="button"
                          [disabled]="!isTypeStepValid"
                          (click)="goToStep(1)"
                          style="background:#1A5276;color:white;border-radius:8px;">
                    Suivant <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </mat-step>

              <!-- Identifiants -->
              <mat-step [completed]="isCredentialsStepValid">
                <ng-template matStepLabel>Identifiants</ng-template>
                <div class="form-section" style="padding-top:20px;">
                  <h3>Identifiants de connexion</h3>
                  <mat-form-field appearance="outline" floatLabel="always"
                                  subscriptSizing="dynamic" style="width:100%;margin-bottom:4px;">
                    <mat-label>Adresse email</mat-label>
                    <input matInput formControlName="email" type="email" placeholder="utilisateur@steevacare.cm">
                    <mat-icon matSuffix style="color:#7F8C8D;">email</mat-icon>
                    <mat-error *ngIf="form.get('email')?.hasError('required')">Obligatoire</mat-error>
                    <mat-error *ngIf="form.get('email')?.hasError('email')">Email invalide</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" floatLabel="always"
                                  subscriptSizing="dynamic" style="width:100%;">
                    <mat-label>Mot de passe temporaire</mat-label>
                    <input matInput formControlName="password"
                           [type]="showPwd ? 'text' : 'password'"
                           placeholder="Minimum 8 caractères">
                    <button mat-icon-button matSuffix type="button"
                            [attr.aria-label]="showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                            (click)="showPwd=!showPwd">
                      <mat-icon style="color:#7F8C8D;">
                        {{showPwd?'visibility_off':'visibility'}}
                      </mat-icon>
                    </button>
                    <mat-error>Minimum 8 caractères</mat-error>
                  </mat-form-field>
                </div>

                <div style="display:flex;justify-content:space-between;margin-top:16px;">
                  <button mat-stroked-button type="button" (click)="goToStep(0)" style="border-radius:8px;">
                    <mat-icon>arrow_back</mat-icon> Retour
                  </button>
                  <button mat-raised-button type="button"
                          [disabled]="!isCredentialsStepValid"
                          (click)="goToStep(2)"
                          style="background:#1A5276;color:white;border-radius:8px;">
                    Suivant <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </mat-step>

              <!-- Infos -->
              <mat-step [completed]="isInfoStepValid">
                <ng-template matStepLabel>Infos</ng-template>
                <div class="form-section" style="padding-top:20px;">
                  <h3>Informations personnelles</h3>
                  <div class="form-row">
                    <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                      <mat-label>Nom</mat-label>
                      <input matInput formControlName="nom" placeholder="Nom">
                      <mat-error>Obligatoire</mat-error>
                    </mat-form-field>
                    <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                      <mat-label>Prénom</mat-label>
                      <input matInput formControlName="prenom" placeholder="Prénom">
                      <mat-error>Obligatoire</mat-error>
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" floatLabel="always"
                                  subscriptSizing="dynamic" style="width:100%;">
                    <mat-label>Téléphone</mat-label>
                    <input matInput formControlName="telephone" placeholder="6XXXXXXXX">
                    <mat-icon matSuffix style="color:#7F8C8D;">phone</mat-icon>
                  </mat-form-field>
                </div>

                <div style="display:flex;justify-content:space-between;margin-top:16px;">
                  <button mat-stroked-button type="button" (click)="goToStep(1)" style="border-radius:8px;">
                    <mat-icon>arrow_back</mat-icon> Retour
                  </button>
                  <button mat-raised-button type="button"
                          [disabled]="!isInfoStepValid"
                          (click)="goToStep(3)"
                          style="background:#1A5276;color:white;border-radius:8px;">
                    Suivant <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </mat-step>

              <!-- Profil -->
              <mat-step [completed]="isProfileStepValid">
                <ng-template matStepLabel>Profil</ng-template>
                <div style="padding-top:20px;">
                  <div *ngIf="selectedRole === 'DOCTOR'" class="form-section"
                       style="border:1px solid #D6EAF8;border-radius:10px;
                              padding:20px;background:#EBF5FB;">
                    <h3 style="color:#1A5276;">🩺 Profil Médecin</h3>
                    <mat-form-field appearance="outline" floatLabel="always"
                                    subscriptSizing="dynamic" style="width:100%;margin-bottom:4px;">
                      <mat-label>Spécialité *</mat-label>
                      <mat-select formControlName="specialite">
                        <mat-option *ngFor="let s of specialites; trackBy: trackByItem" [value]="s">{{s}}</mat-option>
                      </mat-select>
                      <mat-error>La spécialité est obligatoire</mat-error>
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                        <mat-label>Numéro d'ordre</mat-label>
                        <input matInput formControlName="numeroOrdre" placeholder="ONMC-XXXX">
                      </mat-form-field>
                      <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                        <mat-label>Tarif consultation</mat-label>
                        <input matInput type="number" formControlName="tarif" placeholder="15000">
                        <span matSuffix>FCFA</span>
                      </mat-form-field>
                    </div>

                    <div class="form-row">
                      <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                        <mat-label>Années d'expérience</mat-label>
                        <input matInput type="number" formControlName="anneesExperience" placeholder="5">
                      </mat-form-field>
                      <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                        <mat-label>Ville</mat-label>
                        <mat-select formControlName="villeMedecin">
                          <mat-option *ngFor="let v of villes; trackBy: trackByItem" [value]="v">{{v}}</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" floatLabel="always"
                                    subscriptSizing="dynamic" style="width:100%;">
                      <mat-label>Biographie</mat-label>
                      <textarea matInput formControlName="biographie" rows="3" maxlength="500"
                                placeholder="Présentation courte du médecin"></textarea>
                      <mat-hint align="end">
                        {{form.get('biographie')?.value?.length ?? 0}}/500
                      </mat-hint>
                    </mat-form-field>
                  </div>

                  <div *ngIf="selectedRole === 'PHARMACY'" class="form-section"
                       style="border:1px solid #E8DAEF;border-radius:10px;
                              padding:20px;background:#F5EEF8;">
                    <h3 style="color:#6C3483;">💊 Profil Pharmacie</h3>

                    <mat-form-field appearance="outline" floatLabel="always"
                                    subscriptSizing="dynamic" style="width:100%;margin-bottom:4px;">
                      <mat-label>Nom de la pharmacie *</mat-label>
                      <input matInput formControlName="nomPharmacie" placeholder="Pharmacie Centrale">
                      <mat-error>Obligatoire</mat-error>
                    </mat-form-field>

                    <div class="form-row">
                      <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                        <mat-label>Ville</mat-label>
                        <mat-select formControlName="villePharmacie">
                          <mat-option *ngFor="let v of villes; trackBy: trackByItem" [value]="v">{{v}}</mat-option>
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic">
                        <mat-label>N° Autorisation MINSANTE</mat-label>
                        <input matInput formControlName="numeroAutorisation" placeholder="MINSANTE-XXXX">
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" floatLabel="always"
                                    subscriptSizing="dynamic" style="width:100%;">
                      <mat-label>Adresse complète</mat-label>
                      <input matInput formControlName="adressePharmacie" placeholder="Quartier, rue, repère">
                    </mat-form-field>
                  </div>

                  <div *ngIf="selectedRole !== 'DOCTOR' && selectedRole !== 'PHARMACY'"
                       style="background:#F5F6FA;border-radius:10px;padding:20px;color:#7F8C8D;">
                    Aucun profil métier complémentaire n'est requis pour ce rôle.
                  </div>
                </div>

                <div style="display:flex;justify-content:space-between;margin-top:20px;">
                  <button mat-stroked-button type="button" (click)="goToStep(2)" style="border-radius:8px;">
                    <mat-icon>arrow_back</mat-icon> Retour
                  </button>
                  <button mat-raised-button type="submit"
                          [disabled]="form.invalid || loading"
                          style="border-radius:10px;background:#1A5276;color:white;padding:0 24px;">
                    <span *ngIf="!loading" style="display:flex;align-items:center;gap:8px;">
                      <mat-icon>person_add</mat-icon> Créer le compte
                    </span>
                    <span *ngIf="loading" style="display:flex;align-items:center;gap:8px;">
                      <mat-progress-spinner diameter="20" mode="indeterminate"
                                            color="accent"></mat-progress-spinner>
                      Création en cours...
                    </span>
                  </button>
                </div>
              </mat-step>
            </mat-stepper>
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
  private notification = inject(NotificationService);

  loading      = false;
  showPwd      = false;
  selectedRole = '';
  selectedIndex = 0;

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
    specialite:        [''],
    numeroOrdre:       [''],
    tarif:             [null as number | null],
    anneesExperience:  [null as number | null],
    villeMedecin:      [''],
    biographie:        [''],
    nomPharmacie:      [''],
    villePharmacie:    [''],
    numeroAutorisation:[''],
    adressePharmacie:  [''],
  });

  get isTypeStepValid(): boolean {
    return this.form.get('role')?.valid ?? false;
  }

  get isCredentialsStepValid(): boolean {
    return !!this.form.get('email')?.valid && !!this.form.get('password')?.valid;
  }

  get isInfoStepValid(): boolean {
    return !!this.form.get('nom')?.valid && !!this.form.get('prenom')?.valid;
  }

  get isProfileStepValid(): boolean {
    if (this.selectedRole === 'DOCTOR') return this.form.get('specialite')?.valid ?? false;
    if (this.selectedRole === 'PHARMACY') return this.form.get('nomPharmacie')?.valid ?? false;
    return this.isTypeStepValid;
  }

  goToStep(index: number): void {
    this.selectedIndex = index;
  }

  onRoleChange(role: string): void {
    this.selectedRole = role;

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
        this.notification.success(`✅ Compte ${res.prenom} ${res.nom} créé avec succès !`, 4000);
        this.form.reset();
        this.selectedRole = '';
        this.selectedIndex = 0;
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.erreur ?? 'Erreur lors de la création';
        this.notification.error(msg, 5000);
      }
    });
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }

}
