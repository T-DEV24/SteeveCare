// src/app/features/doctor/consultation/consultation.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';

interface Appointment {
  id: number; patientNom: string; patientPrenom: string; patientId: number;
  doctorNom: string; doctorPrenom: string; doctorSpecialite: string;
  dateHeure: string; type: string; statut: string; motif: string;
}
interface Pharmacy { id: number; nom: string; prenom?: string; }

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [InitialsPipe, DateFrPipe, SidebarComponent, CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule,
            MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
            MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'doctor'" [activeRoute]="'/doctor/consultation'"></app-sidebar>

      <main class="main-content" style="flex:1;">

        <div *ngIf="loading" style="text-align:center;padding:80px;">
          <mat-progress-spinner mode="indeterminate" diameter="56" style="margin:0 auto;"></mat-progress-spinner>
          <p style="margin-top:16px;color:#7F8C8D;">Chargement de la consultation...</p>
        </div>

        <ng-container *ngIf="!loading && appointment">
          <!-- Header -->
          <div style="background:white;border-radius:12px;padding:20px;
                      margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);
                      display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:52px;height:52px;border-radius:14px;background:#0B5345;
                          display:flex;align-items:center;justify-content:center;
                          color:white;font-size:20px;font-weight:700;">
                {{ appointment.patientNom | initials:appointment.patientPrenom }}
              </div>
              <div>
                <div style="font-weight:700;font-size:17px;">
                  {{appointment.patientPrenom}} {{appointment.patientNom}}
                </div>
                <div style="font-size:12px;color:#7F8C8D;">
                  📅 {{ appointment.dateHeure | dateFr }} —
                  {{appointment.type === 'VIDEO' ? '📹 Vidéo' : '💬 Messagerie'}}
                </div>
              </div>
            </div>
            <span style="background:#D5F5E3;color:#1E8449;padding:4px 14px;
                         border-radius:20px;font-size:12px;font-weight:600;">
              EN COURS
            </span>
          </div>

          <!-- Motif -->
          <mat-card style="padding:20px;margin-bottom:20px;">
            <h3 style="font-size:14px;font-weight:600;color:#7F8C8D;
                       text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
              Motif de consultation
            </h3>
            <p style="font-size:14px;color:#2C3E50;font-style:italic;
                      background:#F5F6FA;padding:12px;border-radius:8px;">
              "{{appointment.motif}}"
            </p>
          </mat-card>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">

            <!-- Notes médicales -->
            <mat-card style="padding:20px;">
              <h3 style="font-size:14px;font-weight:600;color:#0B5345;
                         margin-bottom:14px;display:flex;align-items:center;gap:6px;">
                <mat-icon style="font-size:18px;">note_alt</mat-icon>
                Notes médicales
              </h3>
              <textarea [(ngModel)]="notesMedecin" rows="6"
                        placeholder="Observations cliniques, diagnostic, recommandations..."
                        style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;
                               font-size:13px;resize:vertical;font-family:inherit;
                               outline:none;line-height:1.6;">
              </textarea>
            </mat-card>

            <!-- Prescription -->
            <mat-card style="padding:20px;">
              <h3 style="font-size:14px;font-weight:600;color:#0B5345;
                         margin-bottom:14px;display:flex;align-items:center;gap:6px;">
                <mat-icon style="font-size:18px;">medication</mat-icon>
                Ordonnance
              </h3>
              <div style="display:flex;flex-direction:column;gap:12px;">
                <div>
                  <label style="font-size:12px;font-weight:500;color:#7F8C8D;display:block;margin-bottom:4px;">
                    Médicaments *
                  </label>
                  <textarea [(ngModel)]="medicaments" rows="2"
                            placeholder="Ex: Paracétamol 500mg, Amoxicilline 1g..."
                            style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;
                                   font-size:13px;resize:vertical;font-family:inherit;outline:none;">
                  </textarea>
                </div>
                <div>
                  <label style="font-size:12px;font-weight:500;color:#7F8C8D;display:block;margin-bottom:4px;">
                    Posologie
                  </label>
                  <input [(ngModel)]="posologie" type="text"
                         placeholder="Ex: 3 fois par jour après les repas"
                         style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;
                                font-size:13px;font-family:inherit;outline:none;">
                </div>
                <div>
                  <label style="font-size:12px;font-weight:500;color:#7F8C8D;display:block;margin-bottom:4px;">
                    Instructions particulières
                  </label>
                  <input [(ngModel)]="instructions" type="text"
                         placeholder="Ex: Prendre avec de l'eau, éviter l'alcool..."
                         style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;
                                font-size:13px;font-family:inherit;outline:none;">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                  <div>
                    <label style="font-size:12px;font-weight:500;color:#7F8C8D;display:block;margin-bottom:4px;">
                      Durée (jours)
                    </label>
                    <input [(ngModel)]="dureeJours" type="number" min="1"
                           placeholder="7"
                           style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;
                                  font-size:13px;font-family:inherit;outline:none;">
                  </div>
                  <div>
                    <label style="font-size:12px;font-weight:500;color:#7F8C8D;display:block;margin-bottom:4px;">
                      Transmettre à
                    </label>
                    <select [(ngModel)]="selectedPharmacyId"
                            style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;
                                   font-size:13px;font-family:inherit;outline:none;">
                      <option [value]="null">-- Choisir --</option>
                      <option *ngFor="let p of pharmacies; trackBy: trackByItem" [value]="p.id">
                        {{p.nom}}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </mat-card>
          </div>

          <!-- Bouton terminer -->
          <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button mat-stroked-button routerLink="/doctor/dashboard"
                    style="border-radius:8px;">
              <mat-icon>arrow_back</mat-icon> Retour
            </button>
            <button mat-raised-button (click)="terminer()"
                    [disabled]="saving"
                    style="background:#0B5345;color:white;border-radius:8px;
                           padding:10px 28px;font-size:15px;">
              <span *ngIf="!saving" style="display:flex;align-items:center;gap:6px;">
                <mat-icon>check_circle</mat-icon> Terminer la consultation
              </span>
              <span *ngIf="saving" style="display:flex;align-items:center;gap:8px;">
                <mat-progress-spinner diameter="18" mode="indeterminate"
                                      color="accent"></mat-progress-spinner>
                Enregistrement...
              </span>
            </button>
          </div>
        </ng-container>
      </main>
    </div>
  `
})
export class ConsultationComponent implements OnInit {
  auth     = inject(AuthService);
  private api      = inject(ApiService);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private notification = inject(NotificationService);

  loading     = true;
  saving      = false;
  appointment: Appointment | null = null;
  pharmacies: { id: number; nom: string }[] = [];

  notesMedecin     = '';
  medicaments      = '';
  posologie        = '';
  instructions     = '';
  dureeJours: number | null = null;
  selectedPharmacyId: number | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/doctor/dashboard']); return; }

    // Charger le RDV
    this.api.get<Appointment[]>('/api/appointments/doctor/me').subscribe({
      next: (rdvs) => {
        this.appointment = rdvs.find(r => r.id === +id) ?? null;
        this.loading = false;
        if (!this.appointment) {
          this.notification.warning('Rendez-vous introuvable', 3000);
          this.router.navigate(['/doctor/dashboard']);
        }
      },
      error: () => { this.loading = false; }
    });

    // Charger uniquement les pharmacies actives via l'endpoint public dédié.
    this.api.get<Pharmacy[]>('/api/pharmacies/active').subscribe({
      next: (pharmacies) => {
        this.pharmacies = pharmacies.map(p => ({
          id: p.id,
          nom: p.prenom ? `${p.prenom} ${p.nom}` : p.nom
        }));
      }
    });
  }

  terminer(): void {
    if (!this.appointment || this.saving) return;
    this.saving = true;

    // 1. Créer la consultation
    const consultationBody = {
      appointmentId: this.appointment.id,
      notesMedecin: this.notesMedecin,
      debutAt: new Date().toISOString(),
      finAt: new Date().toISOString()
    };

    this.api.post<any>('/api/consultations', consultationBody).subscribe({
      next: (consultation) => {
        // 2. Créer l'ordonnance si des médicaments sont renseignés
        if (this.medicaments.trim()) {
          const prescriptionBody = {
            medicaments: this.medicaments,
            posologie: this.posologie,
            instructions: this.instructions,
            dureeJours: this.dureeJours,
            pharmacyId: this.selectedPharmacyId,
            transmiseAPharmacie: !!this.selectedPharmacyId
          };
          this.api.post(`/api/consultations/${consultation.id}/prescriptions`,
            prescriptionBody).subscribe();
        }

        // 3. Marquer le RDV comme terminé
        this.api.patch(`/api/appointments/${this.appointment!.id}/status`,
          { status: 'COMPLETED' }).subscribe({
          next: () => {
            this.saving = false;
            this.notification.success('Consultation terminée ✅', 4000);
            this.router.navigate(['/doctor/dashboard']);
          },
          error: () => { this.saving = false; }
        });
      },
      error: (err) => {
        this.saving = false;
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
      }
    });
  }


  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }

}
