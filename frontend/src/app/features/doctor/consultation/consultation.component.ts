// src/app/features/doctor/consultation/consultation.component.ts
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable, Subject, map, startWith, switchMap, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';

interface Appointment {
  id: number;
  patientNom: string;
  patientPrenom: string;
  patientId: number;
  doctorNom: string;
  doctorPrenom: string;
  doctorSpecialite: string;
  dateHeure: string;
  type: string;
  statut: string;
  motif: string;
}

interface Pharmacy { id: number; nom: string; prenom?: string; }

interface MedicalRecord {
  groupeSanguin?: string;
  bloodType?: string;
  allergies?: string[] | string;
  antecedents?: string[] | string;
  chronicDiseases?: string[] | string;
  notes?: string;
}

interface PreviousConsultation {
  id: number;
  date?: string;
  dateHeure?: string;
  doctorNom?: string;
  doctorPrenom?: string;
  diagnostic?: string;
  notesMedecin?: string;
  traitement?: string;
}

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InitialsPipe,
    DateFrPipe,
    SidebarComponent,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  template: `
    <div class="consultation-layout">
      <app-sidebar [role]="'doctor'" [activeRoute]="'/doctor/consultation'"></app-sidebar>

      <main class="main-content consultation-page">
        <div *ngIf="loading" class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="56"></mat-progress-spinner>
          <p>Chargement de la consultation...</p>
        </div>

        <ng-container *ngIf="!loading && appointment">
          <header class="consultation-header">
            <div class="patient-heading">
              <div class="patient-avatar">
                {{ appointment.patientNom | initials:appointment.patientPrenom }}
              </div>
              <div>
                <p class="header-kicker">Consultation en cours</p>
                <h1>{{appointment.patientPrenom}} {{appointment.patientNom}}</h1>
                <p>
                  {{ appointment.dateHeure | dateFr }} —
                  {{appointment.type === 'VIDEO' ? 'Vidéo' : 'Messagerie'}} —
                  Dr {{appointment.doctorPrenom}} {{appointment.doctorNom}}
                </p>
              </div>
            </div>

            <div class="timer-card" [class.timer-card--alert]="consultationOvertime">
              <mat-icon>{{consultationOvertime ? 'timer_off' : 'timer'}}</mat-icon>
              <span>{{formattedTimer}}</span>
              <small>{{consultationOvertime ? 'Plus de 30 min' : 'Chronomètre'}}</small>
            </div>
          </header>

          <mat-card class="reason-card">
            <h2>Motif de consultation</h2>
            <p>“{{appointment.motif || 'Aucun motif renseigné'}}”</p>
          </mat-card>

          <mat-tab-group animationDuration="250ms" class="consultation-tabs">
            <mat-tab label="Consultation">
              <section class="tab-body">
                <form [formGroup]="consultationForm" class="consultation-form" (ngSubmit)="terminer()">
                  <div class="form-grid">
                    <mat-card class="form-card form-card--wide">
                      <h2><mat-icon>clinical_notes</mat-icon> Notes cliniques</h2>

                      <mat-form-field appearance="outline">
                        <mat-label>Symptômes</mat-label>
                        <textarea matInput rows="4" formControlName="symptomes"
                                  [matAutocomplete]="symptomsAuto"
                                  placeholder="Ex: Fièvre, toux sèche, céphalées..."></textarea>
                        <mat-autocomplete #symptomsAuto="matAutocomplete" (optionSelected)="appendAutocompleteValue('symptomes', $event.option.value)">
                          <mat-option *ngFor="let symptom of filteredSymptoms$ | async; trackBy: trackByValue" [value]="symptom">
                            {{symptom}}
                          </mat-option>
                        </mat-autocomplete>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Diagnostic</mat-label>
                        <textarea matInput rows="4" formControlName="diagnostic"
                                  [matAutocomplete]="diagnosisAuto"
                                  placeholder="Ex: J06.9 Infection aiguë des voies respiratoires..."></textarea>
                        <mat-autocomplete #diagnosisAuto="matAutocomplete" (optionSelected)="appendAutocompleteValue('diagnostic', $event.option.value)">
                          <mat-option *ngFor="let diagnosis of filteredDiagnoses$ | async; trackBy: trackByValue" [value]="diagnosis">
                            {{diagnosis}}
                          </mat-option>
                        </mat-autocomplete>
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Observations et recommandations</mat-label>
                        <textarea matInput rows="5" formControlName="notesMedecin"
                                  placeholder="Observations cliniques, examens complémentaires, conseils..."></textarea>
                      </mat-form-field>

                      <div class="referral-box">
                        <mat-checkbox formControlName="refererSpecialiste">Référer à un spécialiste</mat-checkbox>
                        <mat-form-field appearance="outline" *ngIf="consultationForm.get('refererSpecialiste')?.value">
                          <mat-label>Spécialiste cible</mat-label>
                          <mat-select formControlName="specialisteCible">
                            <mat-option *ngFor="let specialist of specialists; trackBy: trackByValue" [value]="specialist">
                              {{specialist}}
                            </mat-option>
                          </mat-select>
                        </mat-form-field>
                      </div>
                    </mat-card>

                    <mat-card class="form-card">
                      <div class="section-title-row">
                        <h2><mat-icon>medication</mat-icon> Traitement</h2>
                        <button mat-stroked-button color="primary" type="button" (click)="addMedication()">
                          <mat-icon>add</mat-icon>
                          Ajouter
                        </button>
                      </div>

                      <div formArrayName="medicaments" class="medication-list">
                        <div class="medication-item" *ngFor="let medication of medicaments.controls; let i = index; trackBy: trackByIndex" [formGroupName]="i">
                          <div class="medication-item__header">
                            <strong>Médicament {{i + 1}}</strong>
                            <button mat-icon-button color="warn" type="button" aria-label="Supprimer ce médicament" [disabled]="medicaments.length === 1" (click)="removeMedication(i)">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>

                          <mat-form-field appearance="outline">
                            <mat-label>Nom du médicament</mat-label>
                            <input matInput formControlName="nom" placeholder="Ex: Paracétamol 500mg">
                          </mat-form-field>

                          <mat-form-field appearance="outline">
                            <mat-label>Posologie</mat-label>
                            <input matInput formControlName="posologie" placeholder="Ex: 1 comprimé matin et soir">
                          </mat-form-field>

                          <div class="medication-row">
                            <mat-form-field appearance="outline">
                              <mat-label>Durée (jours)</mat-label>
                              <input matInput type="number" min="1" formControlName="dureeJours">
                            </mat-form-field>
                            <mat-form-field appearance="outline">
                              <mat-label>Instructions</mat-label>
                              <input matInput formControlName="instructions" placeholder="Après repas">
                            </mat-form-field>
                          </div>
                        </div>
                      </div>

                      <mat-form-field appearance="outline">
                        <mat-label>Pharmacie destinataire</mat-label>
                        <mat-select formControlName="selectedPharmacyId">
                          <mat-option [value]="null">-- Choisir plus tard --</mat-option>
                          <mat-option *ngFor="let p of pharmacies; trackBy: trackByItem" [value]="p.id">
                            {{p.nom}}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>
                    </mat-card>
                  </div>

                  <mat-card class="prescription-preview-card">
                    <div class="section-title-row">
                      <h2><mat-icon>picture_as_pdf</mat-icon> Ordonnance générée</h2>
                      <div class="preview-actions">
                        <button mat-stroked-button type="button" (click)="printPrescription()">
                          <mat-icon>print</mat-icon>
                          Imprimer
                        </button>
                        <button mat-raised-button color="primary" type="button" [disabled]="prescriptionSending" (click)="sendPrescriptionToPharmacy()">
                          <mat-progress-spinner *ngIf="prescriptionSending" diameter="18" mode="indeterminate"></mat-progress-spinner>
                          <mat-icon *ngIf="!prescriptionSending">local_pharmacy</mat-icon>
                          Envoyer à la pharmacie
                        </button>
                      </div>
                    </div>

                    <div #prescriptionPreview class="prescription-paper">
                      <div class="prescription-header">
                        <img src="assets/brand/steevacare-logo.svg" alt="SteevaCare">
                        <div>
                          <h3>Dr {{appointment.doctorPrenom}} {{appointment.doctorNom}}</h3>
                          <p>{{appointment.doctorSpecialite || 'Médecine générale'}}</p>
                          <p>Date : {{today | date:'dd/MM/yyyy'}}</p>
                        </div>
                      </div>

                      <div class="prescription-patient">
                        <strong>Patient : {{appointment.patientPrenom}} {{appointment.patientNom}}</strong>
                        <span>Motif : {{appointment.motif || '—'}}</span>
                      </div>

                      <h4>Prescription</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Médicament</th>
                            <th>Posologie</th>
                            <th>Durée</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let medication of prescriptionMedications; trackBy: trackByItem">
                            <td>{{medication.nom || '—'}}</td>
                            <td>{{medication.posologie || '—'}}</td>
                            <td>{{medication.dureeJours ? medication.dureeJours + ' jours' : '—'}}</td>
                            <td>{{medication.instructions || '—'}}</td>
                          </tr>
                          <tr *ngIf="prescriptionMedications.length === 0">
                            <td colspan="4">Aucun médicament renseigné.</td>
                          </tr>
                        </tbody>
                      </table>

                      <div class="prescription-footer">
                        <p>Signature du médecin</p>
                        <strong>Dr {{appointment.doctorNom}}</strong>
                      </div>
                    </div>
                  </mat-card>

                  <div class="page-actions">
                    <button mat-stroked-button routerLink="/doctor/dashboard" type="button">
                      <mat-icon>arrow_back</mat-icon>
                      Retour
                    </button>
                    <button mat-raised-button color="primary" type="submit" [disabled]="saving || consultationForm.invalid">
                      <mat-progress-spinner *ngIf="saving" diameter="18" mode="indeterminate"></mat-progress-spinner>
                      <mat-icon *ngIf="!saving">check_circle</mat-icon>
                      Terminer la consultation
                    </button>
                  </div>
                </form>
              </section>
            </mat-tab>

            <mat-tab label="Dossier patient">
              <section class="tab-body">
                <mat-card class="record-card">
                  <div class="section-title-row">
                    <h2><mat-icon>folder_shared</mat-icon> Résumé médical</h2>
                    <mat-progress-spinner *ngIf="medicalRecordLoading" diameter="28" mode="indeterminate"></mat-progress-spinner>
                  </div>

                  <div *ngIf="!medicalRecordLoading" class="record-grid">
                    <div class="record-item">
                      <span>Groupe sanguin</span>
                      <strong>{{bloodType}}</strong>
                    </div>
                    <div class="record-item record-item--wide">
                      <span>Allergies</span>
                      <p>{{formatMedicalList(medicalRecord?.allergies)}}</p>
                    </div>
                    <div class="record-item record-item--wide">
                      <span>Antécédents</span>
                      <p>{{formatMedicalList(medicalRecord?.antecedents || medicalRecord?.chronicDiseases)}}</p>
                    </div>
                    <div class="record-item record-item--wide" *ngIf="medicalRecord?.notes">
                      <span>Notes</span>
                      <p>{{medicalRecord?.notes}}</p>
                    </div>
                  </div>
                </mat-card>
              </section>
            </mat-tab>

            <mat-tab label="Historique">
              <section class="tab-body">
                <mat-card class="history-card">
                  <div class="section-title-row">
                    <h2><mat-icon>history</mat-icon> Consultations précédentes</h2>
                    <mat-progress-spinner *ngIf="historyLoading" diameter="28" mode="indeterminate"></mat-progress-spinner>
                  </div>

                  <div *ngIf="!historyLoading && previousConsultations.length === 0" class="empty-state">
                    <mat-icon>event_busy</mat-icon>
                    <p>Aucune consultation précédente trouvée.</p>
                  </div>

                  <div class="history-list" *ngIf="!historyLoading && previousConsultations.length > 0">
                    <article *ngFor="let item of previousConsultations; trackBy: trackByItem" class="history-item">
                      <div>
                        <strong>{{item.date || item.dateHeure | dateFr}}</strong>
                        <span>Dr {{item.doctorPrenom || ''}} {{item.doctorNom || ''}}</span>
                      </div>
                      <p><b>Diagnostic :</b> {{item.diagnostic || 'Non renseigné'}}</p>
                      <p><b>Notes :</b> {{item.notesMedecin || '—'}}</p>
                      <p><b>Traitement :</b> {{item.traitement || '—'}}</p>
                    </article>
                  </div>
                </mat-card>
              </section>
            </mat-tab>
          </mat-tab-group>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .consultation-layout { display: flex; min-height: 100vh; background: #F4F8FB; }
    .consultation-page { flex: 1; padding: 24px; }
    .loading-state { text-align: center; padding: 80px; color: #7F8C8D; }
    .loading-state mat-progress-spinner { margin: 0 auto; }
    .consultation-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px; margin-bottom: 20px; border-radius: 18px; background: white; box-shadow: 0 10px 34px rgba(13,51,73,0.08); }
    .patient-heading { display: flex; align-items: center; gap: 16px; }
    .patient-avatar { width: 60px; height: 60px; display: grid; place-items: center; border-radius: 18px; color: white; background: linear-gradient(135deg,#0B5345,#27AE60); font-size: 22px; font-weight: 800; }
    .header-kicker { margin: 0 0 4px; color: #27AE60; font-size: 12px; font-weight: 900; letter-spacing: 1.6px; text-transform: uppercase; }
    .patient-heading h1 { margin: 0; color: #173B52; font-size: 24px; font-weight: 900; }
    .patient-heading p:last-child { margin: 4px 0 0; color: #6D7D88; font-size: 13px; }
    .timer-card { min-width: 128px; display: grid; place-items: center; gap: 4px; padding: 14px 18px; border-radius: 16px; color: #0B5345; background: #E8F8F1; border: 1px solid rgba(39,174,96,0.18); }
    .timer-card mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .timer-card span { font-size: 26px; font-weight: 900; font-variant-numeric: tabular-nums; }
    .timer-card small { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; }
    .timer-card--alert { color: #C0392B; background: #FDEDEC; border-color: rgba(231,76,60,0.35); animation: pulseAlert 1.1s ease-in-out infinite; }
    .reason-card, .form-card, .prescription-preview-card, .record-card, .history-card { border-radius: 18px !important; padding: 22px; box-shadow: 0 10px 34px rgba(13,51,73,0.08) !important; }
    .reason-card { margin-bottom: 20px; }
    .reason-card h2, .form-card h2, .prescription-preview-card h2, .record-card h2, .history-card h2 { margin: 0; display: flex; align-items: center; gap: 8px; color: #0B5345; font-size: 17px; font-weight: 900; }
    .reason-card p { margin: 12px 0 0; padding: 14px; border-radius: 12px; color: #2C3E50; background: #F5F6FA; font-style: italic; }
    .consultation-tabs { background: white; border-radius: 18px; box-shadow: 0 10px 34px rgba(13,51,73,0.06); overflow: hidden; }
    .tab-body { padding: 22px; background: #F8FBFD; }
    .form-grid { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(340px,0.9fr); gap: 20px; }
    .form-card { display: flex; flex-direction: column; gap: 16px; }
    .form-card--wide mat-form-field, .form-card mat-form-field { width: 100%; }
    .section-title-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
    .referral-box { display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 14px; background: #F3FAF7; border: 1px solid rgba(39,174,96,0.14); }
    .medication-list { display: flex; flex-direction: column; gap: 14px; }
    .medication-item { padding: 14px; border-radius: 14px; background: #F7F9FB; border: 1px solid #E7EDF2; }
    .medication-item__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: #173B52; }
    .medication-row { display: grid; grid-template-columns: 140px 1fr; gap: 10px; }
    .prescription-preview-card { margin-top: 20px; }
    .preview-actions, .page-actions { display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap; }
    .prescription-paper { max-width: 840px; margin: 0 auto; padding: 34px; border: 1px solid #D7DEE6; border-radius: 8px; background: white; color: #17202A; box-shadow: inset 0 0 0 6px #F8FAFC; }
    .prescription-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-bottom: 16px; border-bottom: 2px solid #0B5345; }
    .prescription-header img { width: 150px; height: auto; }
    .prescription-header h3 { margin: 0 0 4px; color: #0B5345; }
    .prescription-header p { margin: 2px 0; color: #566573; }
    .prescription-patient { display: flex; flex-direction: column; gap: 4px; margin: 18px 0; padding: 14px; border-radius: 10px; background: #F4F8FB; }
    .prescription-paper h4 { margin: 18px 0 10px; color: #0B5345; text-transform: uppercase; letter-spacing: 1px; }
    .prescription-paper table { width: 100%; border-collapse: collapse; }
    .prescription-paper th, .prescription-paper td { padding: 10px; border: 1px solid #DDE5EC; text-align: left; font-size: 13px; }
    .prescription-paper th { background: #EAF7F1; color: #0B5345; }
    .prescription-footer { margin-top: 44px; text-align: right; }
    .prescription-footer p { margin: 0 0 20px; color: #7F8C8D; }
    .page-actions { margin-top: 20px; }
    button mat-progress-spinner { display: inline-block; margin-right: 8px; vertical-align: middle; }
    button mat-icon { margin-right: 6px; vertical-align: middle; }
    .record-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }
    .record-item { padding: 18px; border-radius: 16px; background: #F7F9FB; border: 1px solid #E7EDF2; }
    .record-item--wide { grid-column: span 2; }
    .record-item span { display: block; margin-bottom: 8px; color: #7F8C8D; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
    .record-item strong { color: #173B52; font-size: 22px; }
    .record-item p { margin: 0; color: #2C3E50; line-height: 1.6; }
    .history-list { display: flex; flex-direction: column; gap: 14px; }
    .history-item { padding: 18px; border-radius: 16px; background: #F7F9FB; border: 1px solid #E7EDF2; }
    .history-item div { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; color: #173B52; }
    .history-item span { color: #7F8C8D; font-size: 13px; }
    .history-item p { margin: 6px 0 0; color: #2C3E50; line-height: 1.5; }
    .empty-state { display: grid; place-items: center; padding: 44px; color: #7F8C8D; text-align: center; }
    .empty-state mat-icon { font-size: 42px; width: 42px; height: 42px; margin-bottom: 8px; }
    @keyframes pulseAlert { 0%,100% { box-shadow: 0 0 0 0 rgba(231,76,60,0.25); } 50% { box-shadow: 0 0 0 10px rgba(231,76,60,0); } }
    @media print { body * { visibility: hidden !important; } .print-prescription, .print-prescription * { visibility: visible !important; } .print-prescription { position: fixed; inset: 0; margin: 0 !important; max-width: none !important; box-shadow: none !important; } }
    @media (max-width: 1100px) { .form-grid { grid-template-columns: 1fr; } }
    @media (max-width: 760px) { .consultation-page { padding: 16px; } .consultation-header, .patient-heading, .prescription-header, .history-item div { align-items: flex-start; flex-direction: column; } .timer-card { width: 100%; } .record-grid, .medication-row { grid-template-columns: 1fr; } .record-item--wide { grid-column: auto; } .section-title-row { align-items: flex-start; flex-direction: column; } .preview-actions, .page-actions { width: 100%; } .preview-actions button, .page-actions button { width: 100%; } }
  `]
})
export class ConsultationComponent implements OnInit, OnDestroy {
  @ViewChild('prescriptionPreview') private prescriptionPreview?: ElementRef<HTMLElement>;

  private readonly destroy$ = new Subject<void>();
  private timerIntervalId: ReturnType<typeof setInterval> | null = null;
  private consultationStartedAt = new Date();
  private readonly fb = inject(FormBuilder);

  auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  loading = true;
  saving = false;
  prescriptionSending = false;
  medicalRecordLoading = false;
  historyLoading = false;
  elapsedSeconds = 0;
  today = new Date();

  appointment: Appointment | null = null;
  pharmacies: { id: number; nom: string }[] = [];
  medicalRecord: MedicalRecord | null = null;
  previousConsultations: PreviousConsultation[] = [];

  readonly commonSymptoms = [
    'Fièvre', 'Toux sèche', 'Toux productive', 'Céphalées', 'Douleurs abdominales',
    'Nausées', 'Vomissements', 'Diarrhée', 'Fatigue intense', 'Vertiges',
    'Dyspnée', 'Douleur thoracique', 'Éruption cutanée', 'Courbatures', 'Rhinorrhée'
  ];

  readonly commonDiagnoses = [
    'J06.9 Infection aiguë des voies respiratoires supérieures',
    'A09 Gastro-entérite infectieuse présumée',
    'I10 Hypertension essentielle',
    'E11 Diabète sucré de type 2',
    'J45 Asthme',
    'N39.0 Infection urinaire',
    'M54.5 Lombalgie',
    'R51 Céphalée',
    'K29 Gastrite',
    'B34 Infection virale sans précision'
  ];

  readonly specialists = [
    'Cardiologue', 'Dermatologue', 'Endocrinologue', 'Gastro-entérologue',
    'Gynécologue', 'Neurologue', 'Ophtalmologue', 'ORL', 'Pédiatre',
    'Pneumologue', 'Psychiatre', 'Urologue'
  ];

  readonly consultationForm = this.fb.group({
    symptomes: [''],
    diagnostic: ['', Validators.required],
    notesMedecin: [''],
    refererSpecialiste: [false],
    specialisteCible: [''],
    selectedPharmacyId: [null as number | null],
    medicaments: this.fb.array([this.createMedicationGroup()])
  });

  filteredSymptoms$!: Observable<string[]>;
  filteredDiagnoses$!: Observable<string[]>;

  ngOnInit(): void {
    this.startTimer();
    this.setupAutocomplete();
    this.watchReferralToggle();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId !== null) clearInterval(this.timerIntervalId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  get medicaments(): FormArray {
    return this.consultationForm.get('medicaments') as FormArray;
  }

  get formattedTimer(): string {
    const minutes = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (this.elapsedSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  get consultationOvertime(): boolean {
    return this.elapsedSeconds > 30 * 60;
  }

  get prescriptionMedications(): Array<{ nom: string; posologie: string; dureeJours: number | null; instructions: string }> {
    return this.medicaments.getRawValue().filter((m: any) => !!m.nom || !!m.posologie || !!m.instructions);
  }

  get bloodType(): string {
    return this.medicalRecord?.groupeSanguin ?? this.medicalRecord?.bloodType ?? 'Non renseigné';
  }

  addMedication(): void {
    this.medicaments.push(this.createMedicationGroup());
  }

  removeMedication(index: number): void {
    if (this.medicaments.length <= 1) return;
    this.medicaments.removeAt(index);
  }

  appendAutocompleteValue(controlName: 'symptomes' | 'diagnostic', value: string): void {
    const control = this.consultationForm.get(controlName) as FormControl;
    const current = control.value?.trim();
    control.setValue(current && current !== value ? `${current}, ${value}` : value);
  }

  terminer(): void {
    if (!this.appointment || this.saving || this.consultationForm.invalid) return;
    this.saving = true;

    const body = this.buildConsultationBody();
    this.api.post<any>('/api/consultations', body)
      .pipe(
        switchMap((consultation) => {
          const medicines = this.prescriptionMedications;
          if (medicines.length === 0) return this.completeAppointment();

          return this.api.post(`/api/consultations/${consultation.id}/prescriptions`, this.buildPrescriptionBody())
            .pipe(switchMap(() => this.completeAppointment()));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.notification.success('Consultation terminée ✅', 4000);
          this.router.navigate(['/doctor/dashboard']);
        },
        error: (err) => {
          this.saving = false;
          this.notification.error(err.error?.erreur ?? err.error?.message ?? 'Erreur lors de la consultation', 4000);
        }
      });
  }

  printPrescription(): void {
    const element = this.prescriptionPreview?.nativeElement;
    if (!element) return;

    element.classList.add('print-prescription');
    window.print();
    setTimeout(() => element.classList.remove('print-prescription'));
  }

  sendPrescriptionToPharmacy(): void {
    if (!this.appointment || this.prescriptionSending) return;
    if (this.prescriptionMedications.length === 0) {
      this.notification.warning('Ajoutez au moins un médicament avant l’envoi.', 3000);
      return;
    }

    this.prescriptionSending = true;
    this.api.post('/api/prescriptions', this.buildPrescriptionBody())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.prescriptionSending = false;
          this.notification.success('Ordonnance envoyée à la pharmacie.', 4000);
        },
        error: (err) => {
          this.prescriptionSending = false;
          this.notification.error(err.error?.erreur ?? err.error?.message ?? 'Impossible d’envoyer l’ordonnance.', 4000);
        }
      });
  }

  formatMedicalList(value: string[] | string | undefined): string {
    if (Array.isArray(value)) return value.length ? value.join(', ') : 'Non renseigné';
    return value?.trim() || 'Non renseigné';
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item?.nom ?? item;
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private loadInitialData(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/doctor/dashboard']);
      return;
    }

    this.api.get<Appointment[]>('/api/appointments/doctor/me')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rdvs) => {
          this.appointment = rdvs.find(r => r.id === +id) ?? null;
          this.loading = false;
          if (!this.appointment) {
            this.notification.warning('Rendez-vous introuvable', 3000);
            this.router.navigate(['/doctor/dashboard']);
            return;
          }
          this.loadPatientMedicalRecord(this.appointment.patientId);
          this.loadPatientHistory(this.appointment.patientId);
        },
        error: () => {
          this.loading = false;
          this.notification.error('Impossible de charger la consultation.', 4000);
        }
      });

    this.api.get<Pharmacy[]>('/api/pharmacies/active')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pharmacies) => {
          this.pharmacies = pharmacies.map(p => ({
            id: p.id,
            nom: p.prenom ? `${p.prenom} ${p.nom}` : p.nom
          }));
        }
      });
  }

  private loadPatientMedicalRecord(patientId: number): void {
    this.medicalRecordLoading = true;
    this.api.get<MedicalRecord>(`/api/patients/${patientId}/medical-record`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (record) => {
          this.medicalRecord = record;
          this.medicalRecordLoading = false;
        },
        error: () => {
          this.medicalRecordLoading = false;
          this.medicalRecord = null;
        }
      });
  }

  private loadPatientHistory(patientId: number): void {
    this.historyLoading = true;
    this.api.get<PreviousConsultation[]>(`/api/patients/${patientId}/consultations`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.previousConsultations = history ?? [];
          this.historyLoading = false;
        },
        error: () => {
          this.previousConsultations = [];
          this.historyLoading = false;
        }
      });
  }

  private createMedicationGroup() {
    return this.fb.group({
      nom: [''],
      posologie: [''],
      dureeJours: [null as number | null],
      instructions: ['']
    });
  }

  private setupAutocomplete(): void {
    this.filteredSymptoms$ = this.consultationForm.get('symptomes')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterOptions(value ?? '', this.commonSymptoms))
    );

    this.filteredDiagnoses$ = this.consultationForm.get('diagnostic')!.valueChanges.pipe(
      startWith(''),
      map(value => this.filterOptions(value ?? '', this.commonDiagnoses))
    );
  }

  private watchReferralToggle(): void {
    this.consultationForm.get('refererSpecialiste')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        const control = this.consultationForm.get('specialisteCible');
        if (enabled) {
          control?.setValidators([Validators.required]);
        } else {
          control?.clearValidators();
          control?.setValue('');
        }
        control?.updateValueAndValidity();
      });
  }

  private filterOptions(value: string, options: string[]): string[] {
    const lastToken = value.split(',').pop()?.trim().toLowerCase() ?? '';
    return options.filter(option => option.toLowerCase().includes(lastToken));
  }

  private startTimer(): void {
    this.consultationStartedAt = new Date();
    this.timerIntervalId = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.consultationStartedAt.getTime()) / 1000);
    }, 1000);
  }

  private buildConsultationBody(): Record<string, unknown> {
    const value = this.consultationForm.getRawValue();
    return {
      appointmentId: this.appointment!.id,
      symptomes: value.symptomes,
      diagnostic: value.diagnostic,
      notesMedecin: value.notesMedecin,
      refererSpecialiste: value.refererSpecialiste,
      specialisteCible: value.specialisteCible,
      debutAt: this.consultationStartedAt.toISOString(),
      finAt: new Date().toISOString()
    };
  }

  private buildPrescriptionBody(): Record<string, unknown> {
    const selectedPharmacyId = this.consultationForm.get('selectedPharmacyId')?.value;
    return {
      appointmentId: this.appointment?.id,
      patientId: this.appointment?.patientId,
      doctorId: this.auth.userId,
      medicaments: this.prescriptionMedications,
      pharmacyId: selectedPharmacyId,
      transmiseAPharmacie: !!selectedPharmacyId,
      datePrescription: new Date().toISOString()
    };
  }

  private completeAppointment(): Observable<unknown> {
    return this.api.patch(`/api/appointments/${this.appointment!.id}/status`, { status: 'COMPLETED' });
  }
}
