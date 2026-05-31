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

interface Appointment {
  id: number; doctorNom: string; doctorPrenom: string; doctorSpecialite: string;
  dateHeure: string; type: string; statut: string;
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule,
            MatCardModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div style="display:flex;min-height:100vh;">

      <!-- SIDEBAR -->
      <aside class="sidebar" style="background:#1A5276;">
        <div class="sidebar-logo"><span class="logo-icon">💊</span> SteevaCare</div>
        <nav class="sidebar-nav">
          <a class="nav-item active" routerLink="/patient/dashboard">
            <mat-icon>home</mat-icon> Accueil
          </a>
          <a class="nav-item" routerLink="/patient/doctors">
            <mat-icon>search</mat-icon> Trouver un médecin
          </a>
          <a class="nav-item" routerLink="/patient/appointments">
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
                matTooltip="Prendre un rendez-vous"
                style="position:fixed;bottom:32px;right:32px;
                       background:#27AE60;color:white;z-index:50;">
          <mat-icon>add</mat-icon>
        </button>
      </main>
    </div>
  `
})
export class PatientDashboardComponent implements OnInit {
  auth    = inject(AuthService);
  private api = inject(ApiService);

  loadingRdv   = true;
  upcomingRdv: Appointment[] = [];

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
        this.upcomingRdv = data
          .filter(r => r.statut === 'PENDING' || r.statut === 'CONFIRMED')
          .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
          .slice(0, 5);
        this.loadingRdv = false;
      },
      error: () => { this.loadingRdv = false; }
    });
  }

  getInitials(nom: string, prenom: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
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
