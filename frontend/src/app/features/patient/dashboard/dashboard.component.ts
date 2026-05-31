// src/app/features/patient/dashboard/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

interface Appointment {
  id: number; doctorNom: string; doctorPrenom: string; doctorSpecialite: string;
  dateHeure: string; type: string; statut: string;
}

interface PrescriptionPreview {
  id: number; medicaments: string; medecinNom?: string; createdAt?: string; codeRetrait?: string;
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, MatIconModule, MatButtonModule,
            MatCardModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div style="display:flex;min-height:100vh;">

      <!-- SIDEBAR -->
      <app-sidebar [role]="'patient'" [activeRoute]="'/patient/dashboard'"></app-sidebar>

      <!-- CONTENU -->
      <main class="main-content" style="flex:1;position:relative;">

        <!-- Header -->
        <div class="page-header">
          <div>
            <h1>Bonjour, {{auth.prenom}} 👋</h1>
            <p style="color:#7F8C8D;font-size:13px;margin-top:2px;">
              Comment puis-je vous aider aujourd'hui ?
            </p>
          </div>
        </div>

        <!-- 4 Action Cards -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);
                    gap:16px;margin-bottom:28px;">
          <a *ngFor="let card of actionCards" [routerLink]="card.link"
             style="text-decoration:none;">
            <div style="background:white;border-radius:14px;padding:24px;
                        cursor:pointer;transition:all 0.2s;
                        box-shadow:0 2px 12px rgba(0,0,0,0.06);
                        border:1px solid #EEF0F4;display:flex;
                        align-items:center;gap:16px;"
                 onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.10)'"
                 onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'">
              <div [style.background]="card.bg"
                   style="width:52px;height:52px;border-radius:14px;
                          display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <mat-icon [style.color]="card.color"
                          style="font-size:26px;width:26px;height:26px;">
                  {{card.icon}}
                </mat-icon>
              </div>
              <div>
                <div style="font-weight:600;font-size:15px;color:#2C3E50;">{{card.title}}</div>
                <div style="font-size:12px;color:#7F8C8D;margin-top:2px;">{{card.subtitle}}</div>
              </div>
            </div>
          </a>
        </div>

        <!-- Graphique RDV 30 jours -->
        <mat-card style="padding:24px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
            <h2 style="font-size:16px;font-weight:600;color:#1A5276;margin:0;">
              📊 Rendez-vous des 30 derniers jours
            </h2>
            <span style="font-size:12px;color:#7F8C8D;">{{appointmentsLast30Total}} RDV</span>
          </div>
          <div style="height:180px;display:flex;align-items:flex-end;gap:6px;
                      padding:12px;background:#F8FAFC;border-radius:12px;">
            <div *ngFor="let bar of appointmentChart"
                 style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;">
              <div [style.height.%]="bar.height"
                   [title]="bar.label + ' : ' + bar.count + ' RDV'"
                   style="width:100%;min-height:4px;background:linear-gradient(180deg,#27AE60,#1A5276);
                          border-radius:6px 6px 2px 2px;transition:height .25s ease;"></div>
              <span style="font-size:9px;color:#7F8C8D;transform:rotate(-45deg);white-space:nowrap;">
                {{bar.shortLabel}}
              </span>
            </div>
          </div>
        </mat-card>

        <!-- Dernières ordonnances -->
        <mat-card style="padding:24px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <h2 style="font-size:16px;font-weight:600;color:#1A5276;margin:0;">
              💊 Dernières ordonnances
            </h2>
            <a routerLink="/patient/medical-record"
               style="font-size:13px;color:#2980B9;text-decoration:none;font-weight:500;">
              Voir dossier médical →
            </a>
          </div>
          <div *ngIf="recentPrescriptions.length > 0" style="display:flex;flex-direction:column;gap:10px;">
            <div *ngFor="let p of recentPrescriptions"
                 style="display:flex;align-items:center;gap:12px;background:#F5F6FA;border-radius:10px;padding:12px 14px;">
              <mat-icon style="color:#27AE60;">receipt_long</mat-icon>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:#2C3E50;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  {{p.medicaments}}
                </div>
                <div style="font-size:11px;color:#7F8C8D;">{{p.medecinNom || 'Médecin'}} · {{formatShortDate(p.createdAt)}}</div>
              </div>
              <span *ngIf="p.codeRetrait" style="font-family:monospace;font-size:11px;color:#1A5276;">{{p.codeRetrait}}</span>
            </div>
          </div>
          <div *ngIf="recentPrescriptions.length === 0" style="color:#7F8C8D;font-size:13px;background:#F5F6FA;border-radius:10px;padding:16px;">
            Aucune ordonnance récente à afficher. Consultez votre dossier médical pour plus de détails.
          </div>
        </mat-card>

        <!-- Prochains rendez-vous -->
        <mat-card style="padding:24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;
                      margin-bottom:20px;">
            <h2 style="font-size:16px;font-weight:600;color:#1A5276;margin:0;">
              📅 Prochains rendez-vous
            </h2>
            <a routerLink="/patient/appointments"
               style="font-size:13px;color:#2980B9;cursor:pointer;text-decoration:none;">
              Voir tous →
            </a>
          </div>

          <div *ngIf="loadingRdv" style="text-align:center;padding:32px;">
            <mat-progress-spinner mode="indeterminate" diameter="36"
                                  style="margin:0 auto;"></mat-progress-spinner>
          </div>

          <!-- Liste RDV -->
          <div *ngIf="!loadingRdv && upcomingRdv.length > 0"
               style="display:flex;flex-direction:column;gap:12px;">
            <div *ngFor="let rdv of upcomingRdv"
                 style="display:flex;align-items:center;gap:14px;
                        background:#F5F6FA;border-radius:10px;padding:14px 16px;">
              <div class="avatar" style="background:#1A5276;flex-shrink:0;">
                {{getInitials(rdv.doctorNom, rdv.doctorPrenom)}}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:500;color:#2C3E50;font-size:14px;">
                  Dr. {{rdv.doctorPrenom}} {{rdv.doctorNom}}
                </div>
                <div style="font-size:12px;color:#7F8C8D;margin-top:2px;">
                  {{rdv.doctorSpecialite}}
                </div>
                <div style="font-size:12px;color:#7F8C8D;margin-top:2px;">
                  📅 {{formatDateFr(rdv.dateHeure)}}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                <!-- CORRECTION: [class] binding -->
                <span [class]="'badge-rdv-' + rdv.statut">{{rdv.statut}}</span>
                <mat-icon style="font-size:18px;color:#7F8C8D;">
                  {{rdv.type === 'VIDEO' ? 'videocam' : 'chat'}}
                </mat-icon>
              </div>
            </div>
          </div>

          <!-- État vide -->
          <div *ngIf="!loadingRdv && upcomingRdv.length === 0" class="empty-state">
            <mat-icon>event_busy</mat-icon>
            <h3>Aucun rendez-vous prévu</h3>
            <p>Consultez notre annuaire pour trouver un médecin</p>
            <button mat-raised-button routerLink="/patient/doctors"
                    style="background:#1A5276;color:white;border-radius:8px;margin-top:16px;">
              Trouver un médecin
            </button>
          </div>
        </mat-card>

        <!-- FAB Prendre RDV — MatTooltipModule ajouté dans imports -->
        <button mat-fab routerLink="/patient/doctors"
                class="pulse-fab"
                matTooltip="Prendre un rendez-vous"
                style="position:fixed;bottom:32px;right:32px;
                       background:#27AE60;color:white;z-index:50;">
          <mat-icon>add</mat-icon>
        </button>
      </main>
    </div>
  `,
  styles: [`
    @keyframes fabPulse {
      0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.6); transform: scale(1); }
      70% { box-shadow: 0 0 0 16px rgba(39, 174, 96, 0); transform: scale(1.04); }
      100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); transform: scale(1); }
    }
    .pulse-fab { animation: fabPulse 1.8s infinite; }
  `]
})
export class PatientDashboardComponent implements OnInit {
  auth    = inject(AuthService);
  private api = inject(ApiService);

  loadingRdv   = true;
  upcomingRdv: Appointment[] = [];
  allAppointments: Appointment[] = [];
  recentPrescriptions: PrescriptionPreview[] = [];

  actionCards = [
    {
      icon: 'videocam', title: 'Consulter un médecin',
      subtitle: 'Téléconsultation vidéo ou messagerie',
      link: '/patient/doctors', color: '#2980B9', bg: '#D6EAF8'
    },
    {
      icon: 'calendar_today', title: 'Mes rendez-vous',
      subtitle: 'Voir et gérer vos consultations',
      link: '/patient/appointments', color: '#27AE60', bg: '#D5F5E3'
    },
    {
      icon: 'folder_shared', title: 'Dossier médical',
      subtitle: 'Antécédents, ordonnances, résultats',
      link: '/patient/medical-record', color: '#E67E22', bg: '#FDEBD0'
    },
    {
      icon: 'chat', title: 'Messagerie',
      subtitle: 'Échanger avec votre médecin',
      link: '/patient/messages', color: '#8E44AD', bg: '#E8DAEF'
    },
  ];

  ngOnInit(): void {
    this.api.get<Appointment[]>('/api/appointments/patient/me').subscribe({
      next: (data) => {
        this.allAppointments = data;
        this.upcomingRdv = data
          .filter(r => r.statut === 'PENDING' || r.statut === 'CONFIRMED')
          .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
          .slice(0, 5);
        this.loadingRdv = false;
      },
      error: () => { this.loadingRdv = false; }
    });

    this.api.get<PrescriptionPreview[]>('/api/prescriptions/patient/me').subscribe({
      next: (data) => {
        this.recentPrescriptions = data
          .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
          .slice(0, 3);
      },
      error: () => { this.recentPrescriptions = []; }
    });
  }

  get appointmentChart() {
    const today = new Date();
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const counts = days.map(day => this.allAppointments.filter(r => {
      const rdvDate = new Date(r.dateHeure);
      rdvDate.setHours(0, 0, 0, 0);
      return rdvDate.getTime() === day.getTime();
    }).length);
    const max = Math.max(...counts, 1);
    return days.map((day, i) => ({
      count: counts[i],
      height: Math.max(6, (counts[i] / max) * 100),
      label: day.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      shortLabel: day.getDate().toString().padStart(2, '0')
    }));
  }

  get appointmentsLast30Total(): number {
    return this.appointmentChart.reduce((sum, bar) => sum + bar.count, 0);
  }

  getInitials(nom: string, prenom: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
  }

  formatShortDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  formatDateFr(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const mois  = ['janvier','février','mars','avril','mai','juin',
                   'juillet','août','septembre','octobre','novembre','décembre'];
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} à ${h}h${m}`;
  }
}
