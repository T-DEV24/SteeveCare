// src/app/features/admin/dashboard/dashboard.component.ts
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';
import { Subject, takeUntil } from 'rxjs';

interface Stats {
  totalPatients: number; totalDoctors: number; totalPharmacies: number;
  totalAdmins: number; comptesPending: number; comptesFrozen: number;
  totalAppointments: number; appointmentsToday: number;
}

interface RecentUser {
  id: number; nom: string; prenom: string; role: string; createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [InitialsPipe, SidebarComponent, CommonModule, RouterModule, MatIconModule, MatButtonModule,
            MatCardModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div style="display:flex;min-height:100vh;">

      <!-- ═══ SIDEBAR ═══ -->
      <app-sidebar [role]="'admin'" [activeRoute]="'/admin/dashboard'"></app-sidebar>

      <!-- ═══ CONTENU ═══ -->
      <main class="main-content" style="flex:1;">

        <!-- Header -->
        <div class="page-header">
          <div>
            <h1>Tableau de bord</h1>
            <p style="color:#7F8C8D;font-size:13px;margin-top:2px;">
              Bienvenue, <strong>{{authService.prenom}} {{authService.nom}}</strong>
            </p>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="badge-role" [class]="'badge-'+authService.userRole()">
              {{authService.userRole()}}
            </span>
          </div>
        </div>

        <!-- Stats Cards -->
        <div *ngIf="loading" style="text-align:center;padding:60px;">
          <mat-progress-spinner mode="indeterminate" diameter="48"
                                style="margin:0 auto;"></mat-progress-spinner>
        </div>

        <div *ngIf="!loading" class="stats-grid">
          <div class="stat-card" *ngFor="let s of statsCards; trackBy: trackByItem">
            <div class="stat-icon" [style.background]="s.color">
              <mat-icon>{{s.icon}}</mat-icon>
            </div>
            <div class="stat-value">{{s.value}}</div>
            <div class="stat-label">{{s.label}}</div>
            <svg viewBox="0 0 100 28" preserveAspectRatio="none" style="width:100%;height:30px;margin-top:10px;">
              <polyline [attr.points]="sparklinePoints(s.sparkline)"
                        fill="none" [attr.stroke]="s.color" stroke-width="3"
                        stroke-linecap="round" stroke-linejoin="round"></polyline>
            </svg>
          </div>
        </div>

        <!-- Actions rapides -->
        <mat-card style="padding:24px;margin-bottom:24px;">
          <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;color:#1A5276;">
            ⚡ Actions rapides
          </h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button mat-raised-button routerLink="/admin/create-user"
                    style="background:#1A5276;color:white;border-radius:8px;
                           padding:8px 20px;">
              <mat-icon>person_add</mat-icon> Ajouter un médecin
            </button>
            <button mat-raised-button routerLink="/admin/create-user"
                    style="background:#8E44AD;color:white;border-radius:8px;
                           padding:8px 20px;">
              <mat-icon>local_pharmacy</mat-icon> Ajouter une pharmacie
            </button>
            <button mat-raised-button routerLink="/admin/users"
                    style="background:#27AE60;color:white;border-radius:8px;
                           padding:8px 20px;">
              <mat-icon>manage_accounts</mat-icon> Gérer les utilisateurs
            </button>
          </div>
        </mat-card>

        <!-- Derniers comptes créés -->
        <mat-card style="padding:24px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <h2 style="font-size:16px;font-weight:600;margin:0;color:#1A5276;">👥 Derniers comptes créés</h2>
            <a routerLink="/admin/users" style="font-size:13px;color:#2980B9;text-decoration:none;">Voir tous →</a>
          </div>
          <div *ngIf="recentUsers.length > 0" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
            <div *ngFor="let u of recentUsers; trackBy: trackByItem" style="display:flex;align-items:center;gap:12px;background:#F5F6FA;border-radius:10px;padding:12px;">
              <div class="avatar" style="background:#1A5276;">{{ u.nom | initials:u.prenom }}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;color:#2C3E50;">{{u.prenom}} {{u.nom}}</div>
                <div style="font-size:11px;color:#7F8C8D;">{{u.role}} · {{formatDate(u.createdAt)}}</div>
              </div>
            </div>
          </div>
          <div *ngIf="recentUsers.length === 0" style="font-size:13px;color:#7F8C8D;background:#F5F6FA;border-radius:10px;padding:16px;">
            Aucun compte récent.
          </div>
        </mat-card>

        <!-- RDV du jour -->
        <mat-card style="padding:24px;">
          <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;color:#1A5276;">
            📅 Activité du jour
          </h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:#F5F6FA;border-radius:10px;padding:16px;text-align:center;">
              <div style="font-size:32px;font-weight:700;color:#1A5276;">
                {{stats?.appointmentsToday ?? 0}}
              </div>
              <div style="color:#7F8C8D;font-size:13px;margin-top:4px;">
                Rendez-vous aujourd'hui
              </div>
            </div>
            <div style="background:#F5F6FA;border-radius:10px;padding:16px;text-align:center;">
              <div style="font-size:32px;font-weight:700;color:#27AE60;">
                {{stats?.totalAppointments ?? 0}}
              </div>
              <div style="color:#7F8C8D;font-size:13px;margin-top:4px;">
                Total rendez-vous
              </div>
            </div>
          </div>
        </mat-card>
      </main>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  authService = inject(AuthService);
  private api = inject(ApiService);

  loading = true;
  stats: Stats | null = null;

  statsCards: { icon: string; color: string; label: string; value: number; sparkline: number[] }[] = [];
  recentUsers: RecentUser[] = [];

  ngOnInit(): void {
    this.api.get<Stats>('/api/admin/stats').pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.stats = data;
        this.statsCards = [
          { icon: 'people',         color: '#2980B9', label: 'Patients',   value: data.totalPatients,   sparkline: this.makeSparkline(data.totalPatients) },
          { icon: 'local_hospital', color: '#27AE60', label: 'Médecins',   value: data.totalDoctors,    sparkline: this.makeSparkline(data.totalDoctors) },
          { icon: 'local_pharmacy', color: '#8E44AD', label: 'Pharmacies', value: data.totalPharmacies, sparkline: this.makeSparkline(data.totalPharmacies) },
          { icon: 'schedule',       color: '#F39C12', label: 'En attente', value: data.comptesPending,  sparkline: this.makeSparkline(data.comptesPending) },
          { icon: 'ac_unit',        color: '#E74C3C', label: 'Gelés',      value: data.comptesFrozen,   sparkline: this.makeSparkline(data.comptesFrozen) },
        ];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.api.get<RecentUser[]>('/api/admin/users').pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => {
        this.recentUsers = users
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 4);
      },
      error: () => { this.recentUsers = []; }
    });
  }

  makeSparkline(value: number): number[] {
    const base = Math.max(value, 1);
    return Array.from({ length: 7 }, (_, i) => Math.max(0, Math.round(base * (0.72 + i * 0.04 + ((i % 2) * 0.08)))));
  }

  sparklinePoints(values: number[]): string {
    const max = Math.max(...values, 1);
    return values.map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 26 - (value / max) * 24;
      return `${x},${y}`;
    }).join(' ');
  }


  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
