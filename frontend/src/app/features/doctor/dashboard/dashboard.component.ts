// src/app/features/doctor/dashboard/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface Appointment {
  id: number; patientNom: string; patientPrenom: string;
  doctorNom: string; doctorPrenom: string; doctorSpecialite: string;
  dateHeure: string; type: string; statut: string; motif: string; motifRejet?: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule,
            MatCardModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <aside class="sidebar" style="background:#0B5345;">
        <div class="sidebar-logo"><span class="logo-icon">🩺</span> SteevaCare</div>
        <nav class="sidebar-nav">
          <a class="nav-item active" routerLink="/doctor/dashboard">
            <mat-icon>dashboard</mat-icon> Tableau de bord
          </a>
          <a class="nav-item" routerLink="/doctor/appointments">
            <mat-icon>calendar_today</mat-icon> Rendez-vous
          </a>
          <a class="nav-item" routerLink="/doctor/messages">
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
              <div *ngFor="let rdv of pending"
                   style="background:#F5F6FA;border-radius:10px;padding:16px;
                          border-left:4px solid #F39C12;">
                <div style="display:flex;justify-content:space-between;
                            align-items:flex-start;gap:12px;">
                  <div style="display:flex;align-items:center;gap:12px;flex:1;">
                    <div class="avatar" style="background:#0B5345;flex-shrink:0;">
                      {{getInitials(rdv.patientNom, rdv.patientPrenom)}}
                    </div>
                    <div>
                      <div style="font-weight:600;">
                        {{rdv.patientPrenom}} {{rdv.patientNom}}
                      </div>
                      <div style="font-size:12px;color:#7F8C8D;">
                        {{formatDateFr(rdv.dateHeure)}} —
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
              <div *ngFor="let rdv of confirmed"
                   style="background:#F5F6FA;border-radius:10px;padding:16px;
                          border-left:4px solid #27AE60;display:flex;
                          align-items:center;justify-content:space-between;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div class="avatar" style="background:#27AE60;">
                    {{getInitials(rdv.patientNom, rdv.patientPrenom)}}
                  </div>
                  <div>
                    <div style="font-weight:500;">
                      {{rdv.patientPrenom}} {{rdv.patientNom}}
                    </div>
                    <div style="font-size:12px;color:#7F8C8D;">
                      {{formatDateFr(rdv.dateHeure)}}
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
  private snackBar = inject(MatSnackBar);

  loading   = true;        // ← CORRECTION : loading ajouté
  all: Appointment[] = [];
  actionLoading: number | null = null;
  showRejectDialog = false;
  rejectMotif = '';
  selectedRdv: Appointment | null = null;

  get pending()   { return this.all.filter(a => a.statut === 'PENDING'); }
  get confirmed() { return this.all.filter(a => a.statut === 'CONFIRMED'); }
  get completed() { return this.all.filter(a => a.statut === 'COMPLETED'); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<Appointment[]>('/api/appointments/doctor/me').subscribe({
      next: (d) => { this.all = d; this.loading = false; },
      error: () => { this.loading = false; }   // ← CORRECTION : gestion erreur
    });
  }

  confirm(rdv: Appointment): void {
    this.actionLoading = rdv.id;
    this.api.patch(`/api/appointments/${rdv.id}/status`, { status: 'CONFIRMED' }).subscribe({
      next: () => {
        this.snackBar.open('Rendez-vous confirmé ✅', '✕', { duration: 3000 });
        this.load(); this.actionLoading = null;
      },
      error: (err) => {
        this.snackBar.open(err.error?.erreur ?? 'Erreur', '✕', { duration: 4000 });
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

  formatDateFr(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    const mois = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${date.getDate()} ${mois[date.getMonth()]} à ${h}h${m}`;
  }
}
