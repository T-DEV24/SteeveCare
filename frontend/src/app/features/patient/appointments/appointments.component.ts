// src/app/features/patient/appointments/appointments.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';

interface Appointment {
  id: number; doctorNom: string; doctorPrenom: string; doctorSpecialite: string;
  dateHeure: string; type: string; statut: string; motifRejet?: string; motif: string;
}

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [InitialsPipe, DateFrPipe, SidebarComponent, CommonModule, RouterModule, MatIconModule, MatButtonModule,
            MatCardModule, MatTabsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'patient'" [activeRoute]="'/patient/appointments'"></app-sidebar>

      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <h1>Mes rendez-vous</h1>
          <button mat-raised-button routerLink="/patient/doctors"
                  style="background:#1A5276;color:white;border-radius:8px;">
            <mat-icon>add</mat-icon> Nouveau RDV
          </button>
        </div>

        <div *ngIf="loading" style="text-align:center;padding:60px;">
          <mat-progress-spinner mode="indeterminate" diameter="48"
                                style="margin:0 auto;"></mat-progress-spinner>
        </div>

        <mat-tab-group *ngIf="!loading" animationDuration="200ms">
          <mat-tab *ngFor="let tab of tabs; trackBy: trackByItem"
                   [label]="tab.label + ' (' + getByStatus(tab.status).length + ')'">
            <div style="padding-top:20px;display:flex;flex-direction:column;gap:14px;">

              <div *ngFor="let rdv of getByStatus(tab.status); trackBy: trackByItem"
                   [style.border-left]="'4px solid ' + getStatusColor(rdv.statut)"
                   style="background:white;border-radius:12px;padding:20px;
                          box-shadow:0 2px 8px rgba(0,0,0,0.06);
                          display:flex;gap:16px;align-items:flex-start;">

                <div class="avatar avatar-lg"
                     [style.background]="getStatusColor(rdv.statut)">
                  {{ rdv.doctorNom | initials:rdv.doctorPrenom }}
                </div>

                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                      <div style="font-weight:600;font-size:15px;">
                        Dr. {{rdv.doctorPrenom}} {{rdv.doctorNom}}
                      </div>
                      <div style="font-size:12px;color:#7F8C8D;margin-top:2px;">
                        {{rdv.doctorSpecialite}}
                      </div>
                    </div>
                    <span [class]="'badge-rdv-' + rdv.statut">{{rdv.statut}}</span>
                  </div>

                  <div style="margin-top:10px;font-size:13px;color:#7F8C8D;
                              display:flex;flex-wrap:wrap;gap:12px;">
                    <span style="display:flex;align-items:center;gap:4px;">
                      <mat-icon style="font-size:15px;">calendar_today</mat-icon>
                      {{ rdv.dateHeure | dateFr }}
                    </span>
                    <span style="display:flex;align-items:center;gap:4px;">
                      <mat-icon style="font-size:15px;">
                        {{rdv.type === 'VIDEO' ? 'videocam' : 'chat'}}
                      </mat-icon>
                      {{rdv.type === 'VIDEO' ? 'Vidéoconsultation' : 'Messagerie'}}
                    </span>
                  </div>

                  <!-- Motif de refus -->
                  <div *ngIf="rdv.motifRejet"
                       style="margin-top:10px;padding:10px 12px;background:#FADBD8;
                              border-radius:8px;font-size:12px;color:#922B21;">
                    <strong>Motif de refus :</strong> {{rdv.motifRejet}}
                  </div>

                  <!-- Actions -->
                  <div style="margin-top:12px;display:flex;gap:8px;">
                    <button *ngIf="rdv.statut === 'CONFIRMED'" mat-raised-button
                            style="background:#27AE60;color:white;border-radius:8px;font-size:13px;">
                      <mat-icon style="font-size:16px;">videocam</mat-icon>
                      Rejoindre la consultation
                    </button>
                    <button *ngIf="rdv.statut === 'PENDING'" mat-stroked-button color="warn"
                            (click)="cancel(rdv)"
                            [disabled]="actionLoading === rdv.id"
                            style="border-radius:8px;font-size:13px;">
                      <mat-icon style="font-size:16px;">cancel</mat-icon> Annuler
                    </button>
                    <mat-progress-spinner *ngIf="actionLoading === rdv.id"
                                          diameter="20" mode="indeterminate"
                                          style="display:inline-block;"></mat-progress-spinner>
                  </div>
                </div>
              </div>

              <div *ngIf="getByStatus(tab.status).length === 0" class="empty-state">
                <mat-icon>event_busy</mat-icon>
                <h3>Aucun rendez-vous {{tab.label.toLowerCase()}}</h3>
                <p *ngIf="tab.status === 'PENDING' || tab.status === 'CONFIRMED'">
                  Consultez notre annuaire pour trouver un médecin
                </p>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </main>
    </div>
  `
})
export class MyAppointmentsComponent implements OnInit {
  auth     = inject(AuthService);
  private api      = inject(ApiService);
  private notification = inject(NotificationService);

  loading = true;
  appointments: Appointment[] = [];
  actionLoading: number | null = null;

  tabs = [
    { label: 'En attente', status: 'PENDING' },
    { label: 'Confirmés',  status: 'CONFIRMED' },
    { label: 'Terminés',   status: 'COMPLETED' },
    { label: 'Annulés',    status: 'CANCELLED' },
  ];

  ngOnInit(): void {
    this.api.get<Appointment[]>('/api/appointments/patient/me').subscribe({
      next: (d) => { this.appointments = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getByStatus(s: string): Appointment[] {
    return this.appointments.filter(a => a.statut === s);
  }

  cancel(rdv: Appointment): void {
    this.actionLoading = rdv.id;
    this.api.patch(`/api/appointments/${rdv.id}/status`, { status: 'CANCELLED' }).subscribe({
      next: () => {
        this.appointments = this.appointments.filter(a => a.id !== rdv.id);
        this.notification.warning('Rendez-vous annulé', 3000);
        this.actionLoading = null;
      },
      error: (err) => {
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
        this.actionLoading = null;
      }
    });
  }


  getStatusColor(s: string): string {
    const c: Record<string, string> = {
      PENDING: '#F39C12', CONFIRMED: '#27AE60',
      COMPLETED: '#2980B9', CANCELLED: '#7F8C8D', REJECTED: '#E74C3C'
    };
    return c[s] ?? '#7F8C8D';
  }


  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }

}
