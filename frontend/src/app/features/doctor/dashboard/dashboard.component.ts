// src/app/features/doctor/dashboard/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';

interface Appointment {
  id: number; patientNom: string; patientPrenom: string;
  doctorNom: string; doctorPrenom: string; doctorSpecialite: string;
  dateHeure: string; type: string; statut: string; motif: string; motifRejet?: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [InitialsPipe, DateFrPipe, SidebarComponent, CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule,
            MatCardModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'doctor'" [activeRoute]="'/doctor/dashboard'" [badgeCounts]="doctorSidebarBadges"></app-sidebar>

      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <div>
            <h1>Bonjour, Dr. {{auth.prenom}} 👋</h1>
            <p style="color:#7F8C8D;font-size:13px;">
              Gérez vos rendez-vous et consultations
            </p>
          </div>
        </div>

        <!-- Spinner global -->
        <div *ngIf="loading" style="text-align:center;padding:80px;">
          <mat-progress-spinner mode="indeterminate" diameter="52"
                                style="margin:0 auto;"></mat-progress-spinner>
          <p style="margin-top:16px;color:#7F8C8D;font-size:13px;">
            Chargement de vos rendez-vous...
          </p>
        </div>

        <ng-container *ngIf="!loading">

          <!-- Stats -->
          <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
            <div class="stat-card">
              <div class="stat-icon" style="background:#F39C12;">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="stat-value">{{pending.length}}</div>
              <div class="stat-label">En attente</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background:#27AE60;">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="stat-value">{{confirmed.length}}</div>
              <div class="stat-label">Confirmés</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background:#2980B9;">
                <mat-icon>done_all</mat-icon>
              </div>
              <div class="stat-value">{{completed.length}}</div>
              <div class="stat-label">Terminés</div>
            </div>
          </div>

          <!-- Tendance hebdomadaire -->
          <mat-card style="padding:20px;margin-bottom:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div>
                <h2 style="font-size:16px;font-weight:600;color:#2C3E50;margin:0 0 6px;">Activité hebdomadaire</h2>
                <p style="font-size:12px;color:#7F8C8D;margin:0;">Comparaison des rendez-vous créés cette semaine</p>
              </div>
              <div style="display:flex;align-items:center;gap:18px;">
                <div style="text-align:right;">
                  <div style="font-size:12px;color:#7F8C8D;">Cette semaine</div>
                  <div style="font-size:26px;font-weight:700;color:#0B5345;">{{currentWeekCount}}</div>
                </div>
                <mat-icon [style.color]="weekTrend >= 0 ? '#27AE60' : '#E74C3C'" style="font-size:30px;width:30px;height:30px;">
                  {{weekTrend >= 0 ? 'trending_up' : 'trending_down'}}
                </mat-icon>
                <div>
                  <div style="font-size:12px;color:#7F8C8D;">Semaine précédente</div>
                  <div style="font-size:18px;font-weight:700;color:#7F8C8D;">{{previousWeekCount}}</div>
                  <div [style.color]="weekTrend >= 0 ? '#27AE60' : '#E74C3C'" style="font-size:12px;font-weight:600;">
                    {{weekTrend >= 0 ? '+' : ''}}{{weekTrend}} RDV
                  </div>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- En attente -->
          <mat-card style="padding:24px;margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
              <h2 style="font-size:16px;font-weight:600;margin:0;color:#2C3E50;">
                En attente de votre réponse
              </h2>
              <span *ngIf="pending.length > 0"
                    style="background:#E74C3C;color:white;border-radius:50%;
                           width:22px;height:22px;display:flex;align-items:center;
                           justify-content:center;font-size:11px;font-weight:700;">
                {{pending.length}}
              </span>
            </div>

            <div *ngIf="pending.length === 0" class="empty-state" style="padding:24px;">
              <mat-icon>check_circle</mat-icon>
              <p>Aucun rendez-vous en attente ✅</p>
            </div>

            <div style="display:flex;flex-direction:column;gap:12px;">
              <div *ngFor="let rdv of pending; trackBy: trackByItem"
                   style="background:#F5F6FA;border-radius:10px;padding:16px;
                          border-left:4px solid #F39C12;">
                <div style="display:flex;justify-content:space-between;
                            align-items:flex-start;gap:12px;">
                  <div style="display:flex;align-items:center;gap:12px;flex:1;">
                    <div class="avatar" style="background:#0B5345;flex-shrink:0;">
                      {{ rdv.patientNom | initials:rdv.patientPrenom }}
                    </div>
                    <div>
                      <div style="font-weight:600;">
                        {{rdv.patientPrenom}} {{rdv.patientNom}}
                      </div>
                      <div style="font-size:12px;color:#7F8C8D;">
                        {{ rdv.dateHeure | dateFr }} —
                        {{rdv.type === 'VIDEO' ? '📹 Vidéo' : '💬 Message'}}
                      </div>
                      <p *ngIf="rdv.motif"
                         style="font-size:12px;color:#2C3E50;font-style:italic;margin-top:6px;">
                        "{{rdv.motif}}"
                      </p>
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;flex-shrink:0;">
                    <button mat-raised-button (click)="confirm(rdv)"
                            [disabled]="actionLoading === rdv.id"
                            style="background:#27AE60;color:white;border-radius:8px;font-size:13px;">
                      <mat-icon style="font-size:16px;">check</mat-icon> Confirmer
                    </button>
                    <button mat-stroked-button color="warn"
                            (click)="openRejectDialog(rdv)"
                            [disabled]="actionLoading === rdv.id"
                            style="border-radius:8px;font-size:13px;">
                      <mat-icon style="font-size:16px;">close</mat-icon> Refuser
                    </button>
                    <mat-progress-spinner *ngIf="actionLoading === rdv.id"
                                          diameter="20" mode="indeterminate"
                                          style="display:inline-block;"></mat-progress-spinner>
                  </div>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- Confirmés -->
          <mat-card style="padding:24px;">
            <h2 style="font-size:16px;font-weight:600;margin-bottom:20px;color:#2C3E50;">
              Prochains rendez-vous confirmés
            </h2>
            <div *ngIf="confirmed.length === 0" class="empty-state" style="padding:24px;">
              <mat-icon>event_busy</mat-icon>
              <p>Aucun rendez-vous confirmé</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div *ngFor="let rdv of confirmed; trackBy: trackByItem"
                   style="background:#F5F6FA;border-radius:10px;padding:16px;
                          border-left:4px solid #27AE60;display:flex;
                          align-items:center;justify-content:space-between;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div class="avatar" style="background:#27AE60;">
                    {{ rdv.patientNom | initials:rdv.patientPrenom }}
                  </div>
                  <div>
                    <div style="font-weight:500;">
                      {{rdv.patientPrenom}} {{rdv.patientNom}}
                    </div>
                    <div style="font-size:12px;color:#7F8C8D;">
                      {{ rdv.dateHeure | dateFr }}
                    </div>
                  </div>
                </div>
                <button mat-raised-button [routerLink]="['/doctor/consultation', rdv.id]"
                        style="background:#0B5345;color:white;border-radius:8px;font-size:13px;">
                  <mat-icon style="font-size:16px;">play_arrow</mat-icon> Démarrer
                </button>
              </div>
            </div>
          </mat-card>
        </ng-container>
      </main>
    </div>

    <!-- Dialog refus (overlay sans MatDialog) -->
    <div *ngIf="showRejectDialog" class="overlay-backdrop" (click)="showRejectDialog = false">
      <div class="overlay-dialog" (click)="$event.stopPropagation()">
        <h2>Refuser le rendez-vous</h2>
        <p style="color:#7F8C8D;font-size:13px;margin-bottom:16px;">
          Veuillez indiquer le motif de refus (obligatoire)
        </p>
        <textarea [(ngModel)]="rejectMotif" rows="3"
                  placeholder="Ex : Indisponible, veuillez choisir un autre créneau..."
                  style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;
                         font-size:13px;resize:vertical;font-family:inherit;
                         outline:none;margin-bottom:16px;">
        </textarea>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button mat-stroked-button (click)="showRejectDialog = false"
                  style="border-radius:8px;">
            Annuler
          </button>
          <button mat-raised-button (click)="reject()"
                  [disabled]="!rejectMotif.trim()"
                  style="background:#E74C3C;color:white;border-radius:8px;">
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  `
})
export class DoctorDashboardComponent implements OnInit {
  auth     = inject(AuthService);
  private api      = inject(ApiService);
  private notification = inject(NotificationService);

  loading   = true;
  all: Appointment[] = [];
  actionLoading: number | null = null;
  showRejectDialog = false;
  rejectMotif = '';
  selectedRdv: Appointment | null = null;

  get pending() {
    return this.all
      .filter(a => a.statut === 'PENDING')
      .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
  }
  get confirmed() { return this.all.filter(a => a.statut === 'CONFIRMED'); }
  get completed() { return this.all.filter(a => a.statut === 'COMPLETED'); }

  get doctorSidebarBadges(): Record<string, number> {
    return { '/doctor/appointments': this.pending.length };
  }

  get currentWeekCount(): number {
    return this.countAppointmentsBetween(this.startOfWeek(new Date()), new Date());
  }

  get previousWeekCount(): number {
    const currentStart = this.startOfWeek(new Date());
    const previousStart = new Date(currentStart);
    previousStart.setDate(currentStart.getDate() - 7);
    return this.countAppointmentsBetween(previousStart, currentStart);
  }

  get weekTrend(): number {
    return this.currentWeekCount - this.previousWeekCount;
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<Appointment[]>('/api/appointments/doctor/me').subscribe({
      next: (d) => { this.all = d; this.loading = false; },
      error: () => {
        this.notification.error('Impossible de charger les rendez-vous', 4000);
        this.loading = false;
      }
    });
  }

  confirm(rdv: Appointment): void {
    this.actionLoading = rdv.id;
    this.api.patch(`/api/appointments/${rdv.id}/status`, { status: 'CONFIRMED' }).subscribe({
      next: () => {
        this.notification.success('Rendez-vous confirmé ✅', 3000);
        this.load(); this.actionLoading = null;
      },
      error: (err) => {
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
        this.actionLoading = null;
      }
    });
  }

  openRejectDialog(rdv: Appointment): void {
    this.selectedRdv = rdv;
    this.rejectMotif = '';
    this.showRejectDialog = true;
  }

  reject(): void {
    if (!this.selectedRdv || !this.rejectMotif.trim()) return;
    this.actionLoading = this.selectedRdv.id;
    this.showRejectDialog = false;
    this.api.patch(`/api/appointments/${this.selectedRdv.id}/status`, {
      status: 'REJECTED',
      motifRejet: this.rejectMotif
    }).subscribe({
      next: () => {
        this.notification.warning('Rendez-vous refusé', 3000);
        this.load(); this.actionLoading = null;
      },
      error: (err) => {
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
        this.actionLoading = null;
      }
    });
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private countAppointmentsBetween(start: Date, end: Date): number {
    return this.all.filter(a => {
      const date = new Date(a.dateHeure);
      return date >= start && date < end;
    }).length;
  }



  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }

}
