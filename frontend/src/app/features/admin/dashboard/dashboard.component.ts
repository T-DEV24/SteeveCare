// src/app/features/admin/dashboard/dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  totalPharmacies: number;
  totalAppointments: number;
  comptesPending?: number;
  appointmentsWithoutDoctor?: number;
  expiredPrescriptions?: number;
}

interface DashboardTrend {
  key: string;
  values: number[];
  percent: number;
}

interface AlertSummary {
  pendingAccounts: number;
  unassignedAppointments: number;
  expiredPrescriptions: number;
}

interface RecentUser {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface StatCard {
  key: string;
  label: string;
  value: number;
  icon: string;
  color: string;
  sparkline: number[];
  trend: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    InitialsPipe,
    SidebarComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="admin-layout">
      <app-sidebar [role]="'admin'" [activeRoute]="'/admin/dashboard'"></app-sidebar>

      <main class="main-content admin-dashboard">
        <header class="dashboard-hero">
          <div>
            <p class="hero-kicker">Administration SteevaCare</p>
            <h1>Tableau de bord</h1>
            <p>Bienvenue, <strong>{{authService.prenom}} {{authService.nom}}</strong>. Suivez l’activité et les alertes clés.</p>
          </div>
          <div class="hero-actions">
            <button mat-stroked-button routerLink="/admin/analytics">
              <mat-icon>analytics</mat-icon>
              Analytics
            </button>
            <button mat-raised-button routerLink="/admin/create-user">
              <mat-icon>person_add</mat-icon>
              Nouveau compte
            </button>
          </div>
        </header>

        <div *ngIf="loading" class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
        </div>

        <ng-container *ngIf="!loading">
          <section class="stats-grid">
            <mat-card class="stat-card" *ngFor="let card of statsCards; trackBy: trackByItem">
              <div class="stat-card__top">
                <div class="stat-icon" [style.background]="card.color"><mat-icon>{{card.icon}}</mat-icon></div>
                <div class="trend" [class.trend--down]="card.trend < 0">
                  <mat-icon>{{card.trend >= 0 ? 'trending_up' : 'trending_down'}}</mat-icon>
                  {{abs(card.trend)}}%
                </div>
              </div>
              <div class="stat-value">{{card.value | number}}</div>
              <div class="stat-label">{{card.label}}</div>
              <svg class="sparkline" viewBox="0 0 140 44" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient [attr.id]="'grad-' + card.key" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" [attr.stop-color]="card.color" stop-opacity="0.28"/>
                    <stop offset="100%" [attr.stop-color]="card.color" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <polygon [attr.points]="sparklineArea(card.sparkline)" [attr.fill]="'url(#grad-' + card.key + ')'"/>
                <polyline [attr.points]="sparklinePoints(card.sparkline)" fill="none" [attr.stroke]="card.color" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </mat-card>
          </section>

          <section class="dashboard-grid">
            <mat-card class="alerts-card">
              <div class="section-title">
                <mat-icon>notification_important</mat-icon>
                <div>
                  <h2>Alertes système</h2>
                  <p>Points à traiter en priorité.</p>
                </div>
              </div>
              <div class="alerts-list">
                <a routerLink="/admin/users" [queryParams]="{status:'PENDING'}" class="alert-item warning">
                  <mat-icon>how_to_reg</mat-icon>
                  <div><strong>{{alerts.pendingAccounts}}</strong><span>Comptes en attente de validation</span></div>
                </a>
                <a routerLink="/admin/analytics" class="alert-item danger">
                  <mat-icon>event_busy</mat-icon>
                  <div><strong>{{alerts.unassignedAppointments}}</strong><span>RDV sans médecin assigné</span></div>
                </a>
                <a routerLink="/admin/analytics" class="alert-item muted">
                  <mat-icon>receipt_long</mat-icon>
                  <div><strong>{{alerts.expiredPrescriptions}}</strong><span>Ordonnances expirées</span></div>
                </a>
              </div>
            </mat-card>

            <mat-card class="quick-actions-card">
              <div class="section-title">
                <mat-icon>bolt</mat-icon>
                <div>
                  <h2>Actions rapides</h2>
                  <p>Raccourcis d’administration.</p>
                </div>
              </div>
              <div class="quick-actions">
                <button mat-raised-button routerLink="/admin/create-user"><mat-icon>person_add</mat-icon>Ajouter un médecin</button>
                <button mat-raised-button routerLink="/admin/create-user"><mat-icon>local_pharmacy</mat-icon>Ajouter une pharmacie</button>
                <button mat-raised-button routerLink="/admin/users"><mat-icon>manage_accounts</mat-icon>Gérer les utilisateurs</button>
              </div>
            </mat-card>
          </section>

          <mat-card class="recent-users-card">
            <div class="section-title section-title--between">
              <div>
                <h2>Derniers utilisateurs inscrits</h2>
                <p>Comptes récemment créés sur SteevaCare.</p>
              </div>
              <a routerLink="/admin/users">Voir tous →</a>
            </div>

            <div class="table-wrap" *ngIf="recentUsers.length > 0; else emptyUsers">
              <table>
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Nom</th>
                    <th>Rôle</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of recentUsers; trackBy: trackByItem">
                    <td><div class="avatar" [style.background]="getRoleColor(user.role)">{{user.nom | initials:user.prenom}}</div></td>
                    <td><strong>{{user.prenom}} {{user.nom}}</strong><span>{{user.email || '—'}}</span></td>
                    <td><span class="role-pill">{{user.role}}</span></td>
                    <td>{{formatDate(user.createdAt)}}</td>
                    <td><span class="status-pill" [class.pending]="user.status === 'PENDING'" [class.frozen]="user.status === 'FROZEN'">{{user.status}}</span></td>
                    <td>
                      <button mat-icon-button [routerLink]="['/admin/users']" [queryParams]="{focus:user.id}" matTooltip="Voir le profil"><mat-icon>visibility</mat-icon></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #emptyUsers><div class="empty-state">Aucun compte récent.</div></ng-template>
          </mat-card>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .admin-layout { display:flex; min-height:100vh; background:#F4F8FB; }
    .admin-dashboard { flex:1; padding:24px; }
    .dashboard-hero { display:flex; justify-content:space-between; align-items:center; gap:24px; padding:28px; margin-bottom:24px; color:white; border-radius:28px; background:linear-gradient(135deg,#0D3349,#1A5276 55%,#1E8449); box-shadow:0 18px 54px rgba(13,51,73,.16); }
    .hero-kicker { margin:0 0 6px; color:#8EF2B3; font-size:12px; font-weight:900; letter-spacing:2px; text-transform:uppercase; }
    .dashboard-hero h1 { margin:0 0 8px; font-size:clamp(2rem,4vw,3.3rem); font-weight:900; }
    .dashboard-hero p:last-child { margin:0; color:rgba(255,255,255,.84); }
    .hero-actions { display:flex; gap:12px; flex-wrap:wrap; }
    .hero-actions button[mat-raised-button] { background:white; color:#1A5276; }
    .loading-state { display:grid; place-items:center; padding:70px; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,minmax(180px,1fr)); gap:18px; margin-bottom:24px; }
    .stat-card, .alerts-card, .quick-actions-card, .recent-users-card { border-radius:22px!important; box-shadow:0 14px 44px rgba(13,51,73,.08)!important; }
    .stat-card { padding:20px; overflow:hidden; }
    .stat-card__top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
    .stat-icon { width:48px; height:48px; display:grid; place-items:center; border-radius:16px; color:white; }
    .trend { display:inline-flex; align-items:center; gap:4px; padding:5px 8px; border-radius:999px; color:#1E8449; background:#D5F5E3; font-weight:900; font-size:12px; }
    .trend--down { color:#C0392B; background:#FADBD8; }
    .trend mat-icon { font-size:16px; width:16px; height:16px; }
    .stat-value { color:#173B52; font-size:34px; font-weight:900; }
    .stat-label { color:#7F8C8D; font-size:13px; font-weight:700; }
    .sparkline { width:100%; height:46px; margin-top:12px; }
    .dashboard-grid { display:grid; grid-template-columns:1.1fr .9fr; gap:24px; margin-bottom:24px; }
    .alerts-card, .quick-actions-card, .recent-users-card { padding:24px; }
    .section-title { display:flex; align-items:flex-start; gap:12px; margin-bottom:18px; }
    .section-title mat-icon { color:#1A5276; }
    .section-title h2 { margin:0 0 4px; color:#173B52; font-size:19px; font-weight:900; }
    .section-title p { margin:0; color:#7F8C8D; }
    .section-title--between { justify-content:space-between; }
    .section-title--between a { color:#2980B9; text-decoration:none; font-weight:800; }
    .alerts-list { display:grid; gap:12px; }
    .alert-item { display:flex; gap:12px; align-items:center; padding:16px; border-radius:16px; text-decoration:none; background:#F8FBFD; border:1px solid #E7EDF2; }
    .alert-item mat-icon { color:#1A5276; }
    .alert-item.warning mat-icon { color:#F39C12; } .alert-item.danger mat-icon { color:#E74C3C; }
    .alert-item strong { display:block; color:#173B52; font-size:26px; } .alert-item span { color:#6D7D88; }
    .quick-actions { display:grid; gap:12px; } .quick-actions button { justify-content:flex-start; border-radius:12px; background:#1A5276; color:white; }
    .table-wrap { overflow:auto; } table { width:100%; border-collapse:collapse; } th { text-align:left; color:#7F8C8D; font-size:12px; text-transform:uppercase; letter-spacing:.6px; padding:12px; } td { padding:12px; border-top:1px solid #EEF2F5; color:#2C3E50; } td span { display:block; color:#7F8C8D; font-size:12px; margin-top:2px; }
    .avatar { width:42px; height:42px; display:grid; place-items:center; border-radius:14px; color:white; font-weight:900; }
    .role-pill, .status-pill { display:inline-flex!important; width:fit-content; padding:4px 10px; border-radius:999px; color:#1A5276!important; background:#D6EAF8; font-weight:800; }
    .status-pill.pending { color:#B9770E!important; background:#FDEBD0; } .status-pill.frozen { color:#C0392B!important; background:#FADBD8; }
    .empty-state { padding:24px; border-radius:16px; color:#7F8C8D; background:#F8FBFD; }
    @media (max-width:1100px){ .stats-grid,.dashboard-grid{grid-template-columns:repeat(2,1fr);} .dashboard-hero{align-items:flex-start; flex-direction:column;} }
    @media (max-width:720px){ .admin-dashboard{padding:16px;} .stats-grid,.dashboard-grid{grid-template-columns:1fr;} .hero-actions button{width:100%;} }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly api = inject(ApiService);
  authService = inject(AuthService);

  loading = true;
  statsCards: StatCard[] = [];
  recentUsers: RecentUser[] = [];
  alerts: AlertSummary = { pendingAccounts: 0, unassignedAppointments: 0, expiredPrescriptions: 0 };

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    this.loading = true;
    this.api.get<Stats>('/api/admin/stats').pipe(takeUntil(this.destroy$)).subscribe({
      next: (stats) => {
        this.alerts = {
          pendingAccounts: stats.comptesPending ?? 0,
          unassignedAppointments: stats.appointmentsWithoutDoctor ?? 0,
          expiredPrescriptions: stats.expiredPrescriptions ?? 0
        };
        this.buildCards(stats, []);
        this.loading = false;
      },
      error: () => {
        this.buildCards({ totalDoctors: 0, totalPatients: 0, totalAppointments: 0, totalPharmacies: 0 }, []);
        this.loading = false;
      }
    });

    this.api.get<DashboardTrend[]>('/api/admin/dashboard/trends').pipe(takeUntil(this.destroy$)).subscribe({
      next: (trends) => this.applyTrends(trends)
    });

    this.api.get<AlertSummary>('/api/admin/alerts').pipe(takeUntil(this.destroy$)).subscribe({
      next: (alerts) => { this.alerts = { ...this.alerts, ...alerts }; }
    });

    this.api.get<RecentUser[]>('/api/admin/users/recent', { size: 8 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => { this.recentUsers = users ?? []; },
      error: () => { this.recentUsers = []; }
    });
  }

  sparklinePoints(values: number[]): string {
    const points = this.normalizeSparkline(values);
    return points.map((p, i) => `${i * (140 / Math.max(points.length - 1, 1))},${44 - p * 38}`).join(' ');
  }

  sparklineArea(values: number[]): string {
    const line = this.sparklinePoints(values);
    return `0,44 ${line} 140,44`;
  }

  abs(value: number): number { return Math.abs(value); }

  formatDate(date: string): string {
    return date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = { PATIENT: '#27AE60', DOCTOR: '#2980B9', PHARMACY: '#8E44AD', ADMIN: '#E67E22', GESTIONNAIRE: '#F1C40F', SUPER_ADMIN: '#E74C3C' };
    return colors[role] ?? '#7F8C8D';
  }

  trackByItem(_: number, item: any): unknown { return item?.id ?? item?.key ?? item?.route ?? item?.label ?? item; }

  private buildCards(stats: Stats, trends: DashboardTrend[]): void {
    const trendFor = (key: string) => trends.find(t => t.key === key);
    const fallback = [4, 7, 5, 9, 8, 12, 14];
    this.statsCards = [
      { key: 'doctors', label: 'Médecins', value: stats.totalDoctors, icon: 'medical_services', color: '#2980B9', sparkline: trendFor('doctors')?.values ?? fallback, trend: trendFor('doctors')?.percent ?? 12 },
      { key: 'patients', label: 'Patients', value: stats.totalPatients, icon: 'groups', color: '#27AE60', sparkline: trendFor('patients')?.values ?? [9, 12, 11, 18, 20, 24, 28], trend: trendFor('patients')?.percent ?? 18 },
      { key: 'appointments', label: 'RDV', value: stats.totalAppointments, icon: 'event_available', color: '#F39C12', sparkline: trendFor('appointments')?.values ?? [12, 10, 14, 13, 16, 20, 17], trend: trendFor('appointments')?.percent ?? -4 },
      { key: 'pharmacies', label: 'Pharmacies', value: stats.totalPharmacies, icon: 'local_pharmacy', color: '#8E44AD', sparkline: trendFor('pharmacies')?.values ?? [2, 3, 3, 4, 5, 5, 7], trend: trendFor('pharmacies')?.percent ?? 9 }
    ];
  }

  private applyTrends(trends: DashboardTrend[]): void {
    const values: Stats = {
      totalDoctors: this.statsCards.find(c => c.key === 'doctors')?.value ?? 0,
      totalPatients: this.statsCards.find(c => c.key === 'patients')?.value ?? 0,
      totalAppointments: this.statsCards.find(c => c.key === 'appointments')?.value ?? 0,
      totalPharmacies: this.statsCards.find(c => c.key === 'pharmacies')?.value ?? 0
    };
    this.buildCards(values, trends);
  }

  private normalizeSparkline(values: number[]): number[] {
    const safe = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
    const min = Math.min(...safe);
    const max = Math.max(...safe);
    if (max === min) return safe.map(() => 0.5);
    return safe.map(v => (v - min) / (max - min));
  }
}
