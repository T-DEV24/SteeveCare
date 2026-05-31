// src/app/features/pharmacy/dashboard/dashboard.component.ts
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { Subject, takeUntil } from 'rxjs';

interface Prescription {
  id: number; medicaments: string; posologie: string; instructions: string;
  dureeJours: number; codeRetrait: string; delivree: boolean;
  dateDelivraison?: string; createdAt: string;
  patientNom: string; patientPrenom: string; medecinNom: string;
}

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule,
            MatCardModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'pharmacy'" [activeRoute]="'/pharmacy/dashboard'"></app-sidebar>

      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <div>
            <h1>Tableau de bord</h1>
            <p style="color:#7F8C8D;font-size:13px;">Bienvenue, <strong>{{auth.nom}}</strong></p>
          </div>
        </div>

        <!-- Stats rapides -->
        <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px;">
          <div class="stat-card">
            <div class="stat-icon" style="background:#6C3483;"><mat-icon>description</mat-icon></div>
            <div class="stat-value">{{prescriptions.length}}</div>
            <div class="stat-label">Total ordonnances</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#F39C12;"><mat-icon>schedule</mat-icon></div>
            <div class="stat-value">{{pending.length}}</div>
            <div class="stat-label">En attente</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#27AE60;"><mat-icon>check_circle</mat-icon></div>
            <div class="stat-value">{{delivered.length}}</div>
            <div class="stat-label">Délivrées</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#E67E22;"><mat-icon>today</mat-icon></div>
            <div class="stat-value">{{pendingTodayCount}}</div>
            <div class="stat-label">En attente aujourd'hui</div>
          </div>
        </div>

        <!-- Recherche par code -->
        <mat-card style="padding:24px;margin-bottom:24px;">
          <h2 style="font-size:16px;font-weight:600;color:#6C3483;margin-bottom:16px;">
            🔍 Rechercher une ordonnance par code de retrait
          </h2>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;background:#F5EEF8;border-radius:10px;padding:12px;">
            <div style="display:flex;align-items:center;gap:8px;color:#6C3483;font-weight:600;font-size:13px;">
              <span style="width:10px;height:10px;background:#F39C12;border-radius:50%;display:inline-block;animation:pendingPulse 1.4s infinite;"></span>
              {{pendingTodayCount}} ordonnance(s) en attente aujourd'hui · mise à jour automatique toutes les 30s
            </div>
            <button mat-stroked-button type="button" (click)="simulateQrScan()" style="border-radius:8px;color:#6C3483;">
              <mat-icon>qr_code_scanner</mat-icon> Scanner QR simulé
            </button>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
            <input #codeInput
                   [(ngModel)]="searchCode"
                   (keydown.enter)="searchByCode()"
                   [placeholder]="withdrawalCodePlaceholder"
                   style="flex:1;padding:12px 16px;border:1px solid #ddd;border-radius:8px;
                          font-size:14px;font-family:monospace;outline:none;letter-spacing:1px;
                          border-color:#E8DAEF;">
            <button mat-raised-button (click)="searchByCode()"
                    [disabled]="!searchCode.trim() || searchLoading"
                    style="background:#6C3483;color:white;border-radius:8px;
                           padding:12px 24px;height:48px;">
              <span *ngIf="!searchLoading">Rechercher</span>
              <mat-progress-spinner *ngIf="searchLoading" diameter="20"
                                    mode="indeterminate" color="accent"
                                    style="display:inline-block;"></mat-progress-spinner>
            </button>
          </div>

          <!-- Résultat recherche -->
          <div *ngIf="searchResult" style="margin-top:16px;">
            <div *ngIf="!searchResult.delivree"
                 style="border:2px solid #E8DAEF;border-radius:10px;padding:20px;
                        background:#F5EEF8;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;
                          margin-bottom:14px;">
                <div>
                  <div style="font-weight:700;font-size:16px;color:#6C3483;">
                    Ordonnance #{{'#' + searchResult.id}}
                  </div>
                  <div style="font-size:12px;color:#7F8C8D;margin-top:2px;">
                    Patient : {{searchResult.patientPrenom}} {{searchResult.patientNom}} |
                    Médecin : Dr. {{searchResult.medecinNom}}
                  </div>
                </div>
                <span style="font-family:monospace;background:#E8DAEF;color:#6C3483;
                             padding:4px 12px;border-radius:6px;font-weight:600;font-size:13px;">
                  {{searchResult.codeRetrait}}
                </span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                <div>
                  <div style="font-size:11px;color:#7F8C8D;text-transform:uppercase;
                              letter-spacing:0.5px;margin-bottom:4px;">Médicaments</div>
                  <div style="font-size:13px;color:#2C3E50;font-weight:500;">
                    {{searchResult.medicaments}}
                  </div>
                </div>
                <div>
                  <div style="font-size:11px;color:#7F8C8D;text-transform:uppercase;
                              letter-spacing:0.5px;margin-bottom:4px;">Posologie</div>
                  <div style="font-size:13px;color:#2C3E50;">{{searchResult.posologie || '—'}}</div>
                </div>
                <div>
                  <div style="font-size:11px;color:#7F8C8D;text-transform:uppercase;
                              letter-spacing:0.5px;margin-bottom:4px;">Instructions</div>
                  <div style="font-size:13px;color:#2C3E50;">{{searchResult.instructions || '—'}}</div>
                </div>
                <div>
                  <div style="font-size:11px;color:#7F8C8D;text-transform:uppercase;
                              letter-spacing:0.5px;margin-bottom:4px;">Durée</div>
                  <div style="font-size:13px;color:#2C3E50;">{{searchResult.dureeJours}} jours</div>
                </div>
              </div>
              <button mat-raised-button (click)="deliver(searchResult)"
                      [disabled]="deliverLoading"
                      style="background:#6C3483;color:white;border-radius:8px;">
                <mat-icon>check</mat-icon> Marquer comme délivrée
              </button>
            </div>

            <div *ngIf="searchResult.delivree"
                 style="background:#D5F5E3;border:1px solid #27AE60;border-radius:10px;
                        padding:16px;display:flex;align-items:center;gap:10px;">
              <mat-icon style="color:#1E8449;font-size:24px;">check_circle</mat-icon>
              <div>
                <div style="font-weight:600;color:#1E8449;">✓ Ordonnance déjà délivrée</div>
                <div style="font-size:12px;color:#7F8C8D;">
                  Le {{formatDate(searchResult.dateDelivraison)}}
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="searchError"
               style="margin-top:16px;background:#FADBD8;border:1px solid #E74C3C;
                      border-radius:8px;padding:14px;color:#922B21;font-size:13px;">
            <mat-icon style="vertical-align:middle;font-size:18px;">error</mat-icon>
            {{searchError}}
          </div>
        </mat-card>

        <!-- Liste ordonnances récentes -->
        <mat-card style="padding:24px;">
          <h2 style="font-size:16px;font-weight:600;color:#6C3483;margin-bottom:16px;">
            📋 Ordonnances transmises à votre pharmacie
          </h2>

          <div *ngIf="loading" style="text-align:center;padding:32px;">
            <mat-progress-spinner mode="indeterminate" diameter="36"
                                  style="margin:0 auto;"></mat-progress-spinner>
          </div>

          <table *ngIf="!loading" mat-table [dataSource]="prescriptions" style="width:100%;">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef
                  style="padding:12px;font-size:12px;font-weight:600;
                         color:#7F8C8D;text-transform:uppercase;">Date</th>
              <td mat-cell *matCellDef="let p" style="padding:12px;font-size:13px;">
                {{formatDate(p.createdAt)}}
              </td>
            </ng-container>
            <ng-container matColumnDef="patient">
              <th mat-header-cell *matHeaderCellDef
                  style="padding:12px;font-size:12px;font-weight:600;
                         color:#7F8C8D;text-transform:uppercase;">Patient</th>
              <td mat-cell *matCellDef="let p" style="padding:12px;font-size:13px;">
                {{p.patientPrenom}} {{p.patientNom}}
              </td>
            </ng-container>
            <ng-container matColumnDef="medicaments">
              <th mat-header-cell *matHeaderCellDef
                  style="padding:12px;font-size:12px;font-weight:600;
                         color:#7F8C8D;text-transform:uppercase;">Médicaments</th>
              <td mat-cell *matCellDef="let p" style="padding:12px;font-size:13px;color:#7F8C8D;">
                {{p.medicaments | slice:0:50}}{{p.medicaments?.length > 50 ? '...' : ''}}
              </td>
            </ng-container>
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef
                  style="padding:12px;font-size:12px;font-weight:600;
                         color:#7F8C8D;text-transform:uppercase;">Code</th>
              <td mat-cell *matCellDef="let p" style="padding:12px;">
                <span style="font-family:monospace;background:#F5EEF8;color:#6C3483;
                             padding:3px 8px;border-radius:4px;font-size:12px;">
                  {{p.codeRetrait}}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef
                  style="padding:12px;font-size:12px;font-weight:600;
                         color:#7F8C8D;text-transform:uppercase;">Statut</th>
              <td mat-cell *matCellDef="let p" style="padding:12px;">
                <span *ngIf="p.delivree"
                      style="background:#D5F5E3;color:#1E8449;padding:3px 10px;
                             border-radius:20px;font-size:11px;font-weight:600;">
                  ✓ Délivrée
                </span>
                <span *ngIf="!p.delivree"
                      style="background:#FDEBD0;color:#A04000;padding:3px 10px;
                             border-radius:20px;font-size:11px;font-weight:600;">
                  En attente
                </span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols" style="background:#F5F6FA;"></tr>
            <tr mat-row *matRowDef="let r; columns: cols;"
                style="border-bottom:1px solid #F5F6FA;"></tr>
          </table>

          <div *ngIf="!loading && prescriptions.length === 0" class="empty-state">
            <mat-icon>description</mat-icon>
            <h3>Aucune ordonnance reçue</h3>
          </div>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    @keyframes pendingPulse {
      0% { box-shadow: 0 0 0 0 rgba(243, 156, 18, 0.7); }
      70% { box-shadow: 0 0 0 9px rgba(243, 156, 18, 0); }
      100% { box-shadow: 0 0 0 0 rgba(243, 156, 18, 0); }
    }
  `]
})
export class PharmacyDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  auth     = inject(AuthService);
  private api      = inject(ApiService);
  private notification = inject(NotificationService);

  @ViewChild('codeInput') codeInput?: ElementRef<HTMLInputElement>;

  currentYear = new Date().getFullYear();
  loading       = true;
  searchLoading = false;
  deliverLoading= false;
  prescriptions: Prescription[] = [];
  searchCode    = '';
  searchResult: Prescription | null = null;
  searchError   = '';
  pendingTodayCount = 0;
  private intervalId: any = null;

  cols = ['date','patient','medicaments','code','statut'];

  get pending()   { return this.prescriptions.filter(p => !p.delivree); }
  get delivered() { return this.prescriptions.filter(p => p.delivree); }
  get pendingCount(): number { return this.pending.length; }
  get withdrawalCodePlaceholder(): string { return `Ex: SC-${new Date().getFullYear()}-XXXXXXXX`; }

  ngOnInit(): void {
    this.loadPrescriptions();
    this.loadPendingTodayCount();
    this.intervalId = setInterval(() => {
      this.loadPrescriptions(false);
      this.loadPendingTodayCount();
    }, 30000);
    setTimeout(() => this.focusCodeInput(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.intervalId) clearInterval(this.intervalId);
  }

  loadPrescriptions(showLoader = true): void {
    if (showLoader) this.loading = true;
    this.api.get<Prescription[]>('/api/pharmacy/prescriptions').pipe(takeUntil(this.destroy$)).subscribe({
      next: (d) => { this.prescriptions = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadPendingTodayCount(): void {
    this.api.get<number | { count: number }>('/api/pharmacy/prescriptions/pending-count')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.pendingTodayCount = typeof res === 'number' ? res : (res?.count ?? 0); },
        error: () => { this.pendingTodayCount = this.pending.length; }
      });
  }

  focusCodeInput(): void {
    this.codeInput?.nativeElement.focus();
  }

  simulateQrScan(): void {
    const pendingPrescription = this.pending[0];
    this.searchCode = pendingPrescription?.codeRetrait ?? '';
    this.focusCodeInput();
    if (this.searchCode) this.searchByCode();
  }

  searchByCode(): void {
    if (!this.searchCode.trim()) return;
    this.searchLoading = true;
    this.searchResult  = null;
    this.searchError   = '';
    this.api.get<Prescription>(`/api/pharmacy/prescriptions/retrait/${this.searchCode.trim()}`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (p) => { this.searchResult = p; this.searchLoading = false; },
      error: (err) => {
        this.searchLoading = false;
        this.searchError = err.status === 404
          ? 'Aucune ordonnance trouvée avec ce code de retrait.'
          : (err.error?.erreur ?? 'Erreur lors de la recherche');
      }
    });
  }

  deliver(p: Prescription): void {
    this.deliverLoading = true;
    this.api.patch<Prescription>(`/api/pharmacy/prescriptions/${p.id}/delivered`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.deliverLoading = false;
        this.searchResult = updated;
        const idx = this.prescriptions.findIndex(x => x.id === p.id);
        if (idx >= 0) this.prescriptions[idx] = updated;
        this.prescriptions = [...this.prescriptions];
        this.notification.success('Ordonnance marquée comme délivrée ✅', 3000);
      },
      error: (err) => {
        this.deliverLoading = false;
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
      }
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR',
      { day:'2-digit', month:'short', year:'numeric' });
  }
}
