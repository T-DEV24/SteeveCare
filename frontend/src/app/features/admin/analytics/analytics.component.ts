// src/app/features/admin/analytics/analytics.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

type Period = '7d' | '30d' | '90d' | '12m';

interface Point { label: string; value: number; }
interface RoleDistribution { doctors: number; patients: number; pharmacies: number; }
interface SpecialtyStat { label: string; value: number; }
interface AnalyticsData {
  registrations: Point[];
  roleDistribution: RoleDistribution;
  topSpecialties: SpecialtyStat[];
  completionRate: Point[];
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
  template: `
    <div class="analytics-layout">
      <app-sidebar [role]="'admin'" [activeRoute]="'/admin/analytics'"></app-sidebar>
      <main class="main-content analytics-page">
        <header class="analytics-hero">
          <div>
            <p class="hero-kicker">Pilotage & croissance</p>
            <h1>Analytics</h1>
            <p>Visualisez les inscriptions, rôles, spécialités consultées et taux de complétion.</p>
          </div>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Période</mat-label>
              <mat-select [(ngModel)]="period" (selectionChange)="loadAnalytics()">
                <mat-option value="7d">7j</mat-option>
                <mat-option value="30d">30j</mat-option>
                <mat-option value="90d">90j</mat-option>
                <mat-option value="12m">12m</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button type="button" (click)="exportCsv()"><mat-icon>download</mat-icon>Exporter CSV</button>
          </div>
        </header>

        <div *ngIf="loading" class="loading-state"><mat-progress-spinner diameter="48" mode="indeterminate"></mat-progress-spinner></div>

        <section *ngIf="!loading" class="charts-grid">
          <mat-card class="chart-card chart-card--wide">
            <h2>Évolution des inscriptions</h2>
            <svg viewBox="0 0 640 260" preserveAspectRatio="none">
              <g class="grid-lines"><line *ngFor="let y of [40,90,140,190,240]" x1="40" x2="620" [attr.y1]="y" [attr.y2]="y"/></g>
              <polyline [attr.points]="linePoints(data.registrations, 640, 260)" fill="none" stroke="#27AE60" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
              <circle *ngFor="let point of data.registrations; let i = index; trackBy: trackByLabel" [attr.cx]="pointX(i, data.registrations.length, 640)" [attr.cy]="pointY(point.value, data.registrations, 260)" r="4" fill="#27AE60"/>
            </svg>
          </mat-card>

          <mat-card class="chart-card">
            <h2>Répartition par rôle</h2>
            <svg viewBox="0 0 220 220" class="pie-chart">
              <circle r="70" cx="110" cy="110" fill="transparent" stroke="#2980B9" stroke-width="42" [attr.stroke-dasharray]="pieDash('doctors')" transform="rotate(-90 110 110)"/>
              <circle r="70" cx="110" cy="110" fill="transparent" stroke="#27AE60" stroke-width="42" [attr.stroke-dasharray]="pieDash('patients')" [attr.stroke-dashoffset]="pieOffset('patients')" transform="rotate(-90 110 110)"/>
              <circle r="70" cx="110" cy="110" fill="transparent" stroke="#8E44AD" stroke-width="42" [attr.stroke-dasharray]="pieDash('pharmacies')" [attr.stroke-dashoffset]="pieOffset('pharmacies')" transform="rotate(-90 110 110)"/>
              <text x="110" y="108" text-anchor="middle" class="pie-total">{{roleTotal}}</text>
              <text x="110" y="128" text-anchor="middle" class="pie-label">comptes</text>
            </svg>
            <div class="legend">
              <span><i style="background:#2980B9"></i>Médecins</span>
              <span><i style="background:#27AE60"></i>Patients</span>
              <span><i style="background:#8E44AD"></i>Pharmacies</span>
            </div>
          </mat-card>

          <mat-card class="chart-card">
            <h2>Top 5 spécialités consultées</h2>
            <div class="bar-chart">
              <div *ngFor="let item of data.topSpecialties; trackBy: trackByLabel" class="bar-row">
                <span>{{item.label}}</span>
                <div><i [style.width.%]="barPercent(item.value)"></i></div>
                <strong>{{item.value}}</strong>
              </div>
            </div>
          </mat-card>

          <mat-card class="chart-card chart-card--wide">
            <h2>Taux de complétion des consultations</h2>
            <svg viewBox="0 0 640 260" preserveAspectRatio="none">
              <g class="grid-lines"><line *ngFor="let y of [40,90,140,190,240]" x1="40" x2="620" [attr.y1]="y" [attr.y2]="y"/></g>
              <polyline [attr.points]="linePoints(data.completionRate, 640, 260)" fill="none" stroke="#1A5276" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
              <circle *ngFor="let point of data.completionRate; let i = index; trackBy: trackByLabel" [attr.cx]="pointX(i, data.completionRate.length, 640)" [attr.cy]="pointY(point.value, data.completionRate, 260)" r="4" fill="#1A5276"/>
            </svg>
          </mat-card>
        </section>
      </main>
    </div>
  `,
  styles: [`
    :host{display:block}.analytics-layout{display:flex;min-height:100vh;background:#F4F8FB}.analytics-page{flex:1;padding:24px}.analytics-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:28px;margin-bottom:24px;color:white;border-radius:28px;background:linear-gradient(135deg,#0D3349,#1A5276 55%,#1E8449);box-shadow:0 18px 54px rgba(13,51,73,.16)}.hero-kicker{margin:0 0 6px;color:#8EF2B3;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase}.analytics-hero h1{margin:0 0 8px;font-size:clamp(2rem,4vw,3.3rem);font-weight:900}.analytics-hero p:last-child{margin:0;color:rgba(255,255,255,.84)}.filters{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.filters mat-form-field{width:140px}.filters button{background:white;color:#1A5276}.loading-state{display:grid;place-items:center;padding:70px}.charts-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.chart-card{padding:24px;border-radius:22px!important;box-shadow:0 14px 44px rgba(13,51,73,.08)!important}.chart-card--wide{grid-column:span 2}.chart-card h2{margin:0 0 18px;color:#173B52;font-weight:900}.chart-card svg{width:100%;height:270px}.grid-lines line{stroke:#E8EEF3;stroke-width:1}.pie-chart{height:220px!important}.pie-total{font-size:26px;font-weight:900;fill:#173B52}.pie-label{font-size:12px;fill:#7F8C8D}.legend{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}.legend span{display:flex;align-items:center;gap:6px;color:#6D7D88}.legend i{width:11px;height:11px;border-radius:50%;display:inline-block}.bar-chart{display:grid;gap:16px}.bar-row{display:grid;grid-template-columns:130px 1fr 44px;gap:10px;align-items:center}.bar-row span{color:#173B52;font-weight:800}.bar-row div{height:12px;border-radius:999px;background:#E8EEF3;overflow:hidden}.bar-row i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#1A5276,#27AE60)}.bar-row strong{text-align:right;color:#173B52}@media(max-width:900px){.analytics-hero{align-items:flex-start;flex-direction:column}.charts-grid,.chart-card--wide{grid-template-columns:1fr;grid-column:auto}.filters,.filters mat-form-field,.filters button{width:100%}}
  `]
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly api = inject(ApiService);
  period: Period = '30d';
  loading = true;
  data: AnalyticsData = this.fallbackData();

  ngOnInit(): void { this.loadAnalytics(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get roleTotal(): number { const r = this.data.roleDistribution; return r.doctors + r.patients + r.pharmacies; }

  loadAnalytics(): void {
    this.loading = true;
    this.api.get<AnalyticsData>('/api/admin/analytics', { period: this.period }).pipe(takeUntil(this.destroy$)).subscribe({
      next: data => { this.data = data ?? this.fallbackData(); this.loading = false; },
      error: () => { this.data = this.fallbackData(); this.loading = false; }
    });
  }

  exportCsv(): void {
    const rows = [
      ['section', 'label', 'value'],
      ...this.data.registrations.map(p => ['registrations', p.label, p.value]),
      ['roles', 'Médecins', this.data.roleDistribution.doctors],
      ['roles', 'Patients', this.data.roleDistribution.patients],
      ['roles', 'Pharmacies', this.data.roleDistribution.pharmacies],
      ...this.data.topSpecialties.map(p => ['specialties', p.label, p.value]),
      ...this.data.completionRate.map(p => ['completion', p.label, p.value])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `steevacare-analytics-${this.period}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  linePoints(points: Point[], width: number, height: number): string { return points.map((p, i) => `${this.pointX(i, points.length, width)},${this.pointY(p.value, points, height)}`).join(' '); }
  pointX(index: number, length: number, width: number): number { return 40 + index * ((width - 60) / Math.max(length - 1, 1)); }
  pointY(value: number, points: Point[], height: number): number { const max = Math.max(...points.map(p => p.value), 1); return height - 20 - (value / max) * (height - 60); }
  barPercent(value: number): number { const max = Math.max(...this.data.topSpecialties.map(s => s.value), 1); return (value / max) * 100; }

  pieDash(key: keyof RoleDistribution): string { const circumference = 2 * Math.PI * 70; const value = this.data.roleDistribution[key] || 0; return `${(value / Math.max(this.roleTotal, 1)) * circumference} ${circumference}`; }
  pieOffset(key: keyof RoleDistribution): number { const circumference = 2 * Math.PI * 70; const r = this.data.roleDistribution; if (key === 'patients') return -((r.doctors / Math.max(this.roleTotal, 1)) * circumference); if (key === 'pharmacies') return -(((r.doctors + r.patients) / Math.max(this.roleTotal, 1)) * circumference); return 0; }
  trackByLabel(_: number, item: Point | SpecialtyStat): string { return item.label; }

  private fallbackData(): AnalyticsData {
    const lengthByPeriod: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90, '12m': 12 };
    const prefixByPeriod: Record<Period, string> = { '7d': 'J', '30d': 'J', '90d': 'J', '12m': 'M' };
    const regs = Array.from({ length: lengthByPeriod[this.period] }, (_, i) => ({ label: `${prefixByPeriod[this.period]}${i + 1}`, value: Math.round(8 + Math.sin(i / 3) * 5 + i / 2) }));
    return {
      registrations: regs,
      roleDistribution: { doctors: 120, patients: 1840, pharmacies: 52 },
      topSpecialties: [{ label: 'Généraliste', value: 420 }, { label: 'Pédiatre', value: 260 }, { label: 'Cardiologue', value: 210 }, { label: 'Dermatologue', value: 170 }, { label: 'Gynécologue', value: 145 }],
      completionRate: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((label, i) => ({ label, value: 72 + i * 3 + (i % 2 ? 4 : 0) }))
    };
  }
}
