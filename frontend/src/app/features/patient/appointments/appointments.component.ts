// src/app/features/patient/appointments/appointments.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface Appointment {
  id: number; doctorNom: string; doctorPrenom: string; doctorSpecialite: string;
  dateHeure: string; type: string; statut: string; motifRejet?: string; motif: string;
}

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule,
            MatCardModule, MatTabsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <aside class="sidebar" style="background:#1A5276;">
        <div class="sidebar-logo"><span class="logo-icon">💊</span> SteevaCare</div>
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/patient/dashboard">
            <mat-icon>home</mat-icon> Accueil
          </a>
          <a class="nav-item" routerLink="/patient/doctors">
            <mat-icon>search</mat-icon> Trouver un médecin
          </a>
          <a class="nav-item active" routerLink="/patient/appointments">
            <mat-icon>event</mat-icon> Mes rendez-vous
          </a>
          <a class="nav-item" routerLink="/patient/medical-record">
            <mat-icon>folder_shared</mat-icon> Dossier médical
          </a>
          <a class="nav-item" routerLink="/patient/messages">
            <mat-icon>chat</mat-icon> Messagerie
          </a>
        </nav>
        <div class="sidebar-footer">
          <a class="nav-item" (click)="auth.logout()" style="cursor:pointer;">
            <mat-icon>logout</mat-icon> Déconnexion
          </a>
        </div>
      </aside>

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
          <mat-tab *ngFor="let tab of tabs"
                   [label]="tab.label + ' (' + getByStatus(tab.status).length + ')'">
            <div style="padding-top:20px;display:flex;flex-direction:column;gap:14px;">

              <div *ngFor="let rdv of getByStatus(tab.status)"
                   [style.border-left]="'4px solid ' + getStatusColor(rdv.statut)"
                   style="background:white;border-radius:12px;padding:20px;
                          box-shadow:0 2px 8px rgba(0,0,0,0.06);
                          display:flex;gap:16px;align-items:flex-start;">

                <div class="avatar avatar-lg"
                     [style.background]="getStatusColor(rdv.statut)">
                  {{getInitials(rdv.doctorNom, rdv.doctorPrenom)}}
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
                      {{formatDateFr(rdv.dateHeure)}}
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
  private snackBar = inject(MatSnackBar);

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
        this.snackBar.open('Rendez-vous annulé', '✕', { duration: 3000 });
        this.actionLoading = null;
      },
      error: (err) => {
        this.snackBar.open(err.error?.erreur ?? 'Erreur', '✕', { duration: 4000 });
        this.actionLoading = null;
      }
    });
  }

  getInitials(nom: string, prenom: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
  }

  getStatusColor(s: string): string {
    const c: Record<string, string> = {
      PENDING: '#F39C12', CONFIRMED: '#27AE60',
      COMPLETED: '#2980B9', CANCELLED: '#7F8C8D', REJECTED: '#E74C3C'
    };
    return c[s] ?? '#7F8C8D';
  }

  formatDateFr(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const mois  = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} à ${h}h${m}`;
  }
}
