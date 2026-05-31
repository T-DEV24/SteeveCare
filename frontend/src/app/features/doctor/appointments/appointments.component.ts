// src/app/features/doctor/appointments/appointments.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

interface Appointment {
  id: number; patientNom: string; patientPrenom: string;
  dateHeure: string; type: string; statut: string; motif: string; motifRejet?: string;
}

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule,
            MatCardModule, MatTabsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'doctor'" [activeRoute]="'/doctor/appointments'"></app-sidebar>

      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <h1>Mes rendez-vous</h1>
        </div>

        <div *ngIf="loading" style="text-align:center;padding:60px;">
          <mat-progress-spinner mode="indeterminate" diameter="48"
                                style="margin:0 auto;"></mat-progress-spinner>
        </div>

        <mat-tab-group *ngIf="!loading" animationDuration="200ms">
          <mat-tab *ngFor="let tab of tabs"
                   [label]="tab.label + ' (' + getByStatus(tab.status).length + ')'">
            <div style="padding-top:20px;display:flex;flex-direction:column;gap:12px;">

              <div *ngFor="let rdv of getByStatus(tab.status)"
                   [style.border-left]="'4px solid ' + getStatusColor(rdv.statut)"
                   style="background:white;border-radius:12px;padding:20px;
                          box-shadow:0 2px 8px rgba(0,0,0,0.06);
                          display:flex;gap:14px;align-items:flex-start;">

                <div class="avatar avatar-lg" style="background:#0B5345;flex-shrink:0;">
                  {{getInitials(rdv.patientNom, rdv.patientPrenom)}}
                </div>

                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                      <div style="font-weight:600;font-size:15px;color:#2C3E50;">
                        {{rdv.patientPrenom}} {{rdv.patientNom}}
                      </div>
                      <div style="font-size:12px;color:#7F8C8D;margin-top:3px;
                                  display:flex;gap:12px;flex-wrap:wrap;">
                        <span>
                          <mat-icon style="font-size:13px;vertical-align:middle;">
                            calendar_today
                          </mat-icon>
                          {{formatDateFr(rdv.dateHeure)}}
                        </span>
                        <span>
                          <mat-icon style="font-size:13px;vertical-align:middle;">
                            {{rdv.type === 'VIDEO' ? 'videocam' : 'chat'}}
                          </mat-icon>
                          {{rdv.type === 'VIDEO' ? 'Vidéo' : 'Messagerie'}}
                        </span>
                      </div>
                    </div>
                    <span [class]="'badge-rdv-' + rdv.statut">{{rdv.statut}}</span>
                  </div>

                  <p *ngIf="rdv.motif"
                     style="font-size:12px;color:#7F8C8D;font-style:italic;
                            margin-top:8px;padding:8px;background:#F5F6FA;border-radius:6px;">
                    "{{rdv.motif}}"
                  </p>

                  <div *ngIf="rdv.motifRejet"
                       style="margin-top:8px;padding:8px 10px;background:#FADBD8;
                              border-radius:6px;font-size:12px;color:#922B21;">
                    <strong>Motif de refus :</strong> {{rdv.motifRejet}}
                  </div>

                  <div style="margin-top:12px;display:flex;gap:8px;">
                    <ng-container *ngIf="rdv.statut === 'PENDING'">
                      <button mat-raised-button (click)="updateStatus(rdv, 'CONFIRMED')"
                              [disabled]="actionLoading === rdv.id"
                              style="background:#27AE60;color:white;border-radius:8px;font-size:12px;">
                        <mat-icon style="font-size:15px;">check</mat-icon> Confirmer
                      </button>
                      <button mat-stroked-button color="warn"
                              (click)="openReject(rdv)"
                              [disabled]="actionLoading === rdv.id"
                              style="border-radius:8px;font-size:12px;">
                        <mat-icon style="font-size:15px;">close</mat-icon> Refuser
                      </button>
                    </ng-container>
                    <button *ngIf="rdv.statut === 'CONFIRMED'"
                            mat-raised-button
                            [routerLink]="['/doctor/consultation', rdv.id]"
                            style="background:#0B5345;color:white;border-radius:8px;font-size:12px;">
                      <mat-icon style="font-size:15px;">play_arrow</mat-icon> Démarrer
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
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </main>
    </div>

    <!-- Dialog refus (overlay sans MatDialog) -->
    <div *ngIf="showReject" class="overlay-backdrop" (click)="showReject = false">
      <div class="overlay-dialog" (click)="$event.stopPropagation()">
        <h2>Motif de refus</h2>
        <p style="color:#7F8C8D;font-size:13px;margin-bottom:14px;">
          Veuillez indiquer la raison du refus (obligatoire).
        </p>
        <textarea [(ngModel)]="rejectMotif" rows="3"
                  placeholder="Ex : Indisponible à cette heure, veuillez choisir un autre créneau..."
                  style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;
                         font-size:13px;resize:vertical;font-family:inherit;
                         outline:none;margin-bottom:16px;">
        </textarea>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button mat-stroked-button (click)="showReject = false" style="border-radius:8px;">
            Annuler
          </button>
          <button mat-raised-button (click)="confirmReject()"
                  [disabled]="!rejectMotif.trim()"
                  style="background:#E74C3C;color:white;border-radius:8px;">
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  `
})
export class DoctorAppointmentsComponent implements OnInit {
  auth     = inject(AuthService);
  private api      = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading      = true;
  all: Appointment[] = [];
  actionLoading: number | null = null;
  showReject   = false;
  rejectMotif  = '';
  rdvToReject: Appointment | null = null;

  tabs = [
    { label: 'Tous',       status: 'ALL' },
    { label: 'En attente', status: 'PENDING' },
    { label: 'Confirmés',  status: 'CONFIRMED' },
    { label: 'Terminés',   status: 'COMPLETED' },
    { label: 'Annulés',    status: 'CANCELLED' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<Appointment[]>('/api/appointments/doctor/me').subscribe({
      next: (d) => { this.all = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getByStatus(s: string): Appointment[] {
    return s === 'ALL' ? this.all : this.all.filter(a => a.statut === s);
  }

  updateStatus(rdv: Appointment, status: string): void {
    this.actionLoading = rdv.id;
    this.api.patch(`/api/appointments/${rdv.id}/status`, { status }).subscribe({
      next: () => {
        this.snackBar.open('Statut mis à jour ✅', '✕', { duration: 3000 });
        this.load(); this.actionLoading = null;
      },
      error: (err) => {
        this.snackBar.open(err.error?.erreur ?? 'Erreur', '✕', { duration: 4000 });
        this.actionLoading = null;
      }
    });
  }

  openReject(rdv: Appointment): void {
    this.rdvToReject = rdv; this.rejectMotif = ''; this.showReject = true;
  }

  confirmReject(): void {
    if (!this.rdvToReject || !this.rejectMotif.trim()) return;
    this.actionLoading = this.rdvToReject.id;
    this.showReject = false;
    this.api.patch(`/api/appointments/${this.rdvToReject.id}/status`, {
      status: 'REJECTED', motifRejet: this.rejectMotif
    }).subscribe({
      next: () => {
        this.snackBar.open('Rendez-vous refusé', '✕', { duration: 3000 });
        this.load(); this.actionLoading = null;
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
    const mois = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${date.getDate()} ${mois[date.getMonth()]} à ${h}h${m}`;
  }
}
