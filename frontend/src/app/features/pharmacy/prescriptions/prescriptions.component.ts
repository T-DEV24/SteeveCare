// src/app/features/pharmacy/prescriptions/prescriptions.component.ts
import { AfterViewInit, Component, OnDestroy, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
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
  selector: 'app-prescriptions',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule,
            MatCardModule, MatTableModule, MatPaginatorModule, MatSelectModule,
            MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'pharmacy'" [activeRoute]="'/pharmacy/prescriptions'"></app-sidebar>

      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <h1>Ordonnances</h1>
          <div style="display:flex;gap:10px;">
            <button mat-stroked-button (click)="exportCsv()"
                    style="border-radius:8px;border-color:#6C3483;color:#6C3483;">
              <mat-icon>download</mat-icon> Exporter CSV
            </button>
          </div>
        </div>

        <!-- Filtres -->
        <mat-card style="padding:16px 20px;margin-bottom:20px;">
          <div style="display:flex;gap:16px;align-items:center;">
            <div style="flex:1;position:relative;">
              <input [(ngModel)]="searchText" (input)="applyFilter()"
                     placeholder="Rechercher par patient, médecin ou code..."
                     style="width:100%;padding:10px 16px 10px 40px;border:1px solid #ddd;
                            border-radius:8px;font-size:13px;outline:none;">
              <mat-icon style="position:absolute;left:12px;top:50%;transform:translateY(-50%);
                               color:#7F8C8D;font-size:18px;">search</mat-icon>
            </div>
            <select [(ngModel)]="filterStatus" (change)="applyFilter()"
                    style="padding:10px 14px;border:1px solid #ddd;border-radius:8px;
                           font-size:13px;outline:none;min-width:160px;">
              <option value="">Toutes</option>
              <option value="pending">En attente</option>
              <option value="delivered">Délivrées</option>
            </select>
          </div>
          <div style="margin-top:8px;font-size:12px;color:#7F8C8D;">
            {{dataSource.filteredData.length}} ordonnance(s)
          </div>
        </mat-card>

        <!-- Tableau -->
        <mat-card style="overflow:hidden;padding:0;">
          <div *ngIf="loading" style="text-align:center;padding:48px;">
            <mat-progress-spinner mode="indeterminate" diameter="40"
                                  style="margin:0 auto;"></mat-progress-spinner>
          </div>

          <table *ngIf="!loading" mat-table [dataSource]="dataSource" style="width:100%;">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef style="padding:14px;font-size:12px;
                  font-weight:600;color:#7F8C8D;text-transform:uppercase;">Date</th>
              <td mat-cell *matCellDef="let p" style="padding:14px;font-size:13px;color:#7F8C8D;">
                {{formatDate(p.createdAt)}}
              </td>
            </ng-container>
            <ng-container matColumnDef="patient">
              <th mat-header-cell *matHeaderCellDef style="padding:14px;font-size:12px;
                  font-weight:600;color:#7F8C8D;text-transform:uppercase;">Patient</th>
              <td mat-cell *matCellDef="let p" style="padding:14px;">
                <div style="font-weight:500;font-size:13px;">{{p.patientPrenom}} {{p.patientNom}}</div>
                <div style="font-size:11px;color:#7F8C8D;">Dr. {{p.medecinNom}}</div>
              </td>
            </ng-container>
            <ng-container matColumnDef="medicaments">
              <th mat-header-cell *matHeaderCellDef style="padding:14px;font-size:12px;
                  font-weight:600;color:#7F8C8D;text-transform:uppercase;">Médicaments</th>
              <td mat-cell *matCellDef="let p" style="padding:14px;font-size:12px;color:#2C3E50;max-width:200px;">
                {{p.medicaments | slice:0:60}}{{p.medicaments?.length > 60 ? '...' : ''}}
              </td>
            </ng-container>
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef style="padding:14px;font-size:12px;
                  font-weight:600;color:#7F8C8D;text-transform:uppercase;">Code retrait</th>
              <td mat-cell *matCellDef="let p" style="padding:14px;">
                <span style="font-family:monospace;background:#F5EEF8;color:#6C3483;
                             padding:4px 10px;border-radius:6px;font-size:12px;
                             letter-spacing:1px;">
                  {{p.codeRetrait}}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef style="padding:14px;font-size:12px;
                  font-weight:600;color:#7F8C8D;text-transform:uppercase;">Statut</th>
              <td mat-cell *matCellDef="let p" style="padding:14px;">
                <span *ngIf="p.delivree" class="badge-rdv-DISPENSED">
                  ✓ Délivrée
                </span>
                <span *ngIf="!p.delivree"
                      style="background:#FDEBD0;color:#A04000;padding:3px 10px;
                             border-radius:20px;font-size:11px;font-weight:600;">
                  ⏳ En attente
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef style="padding:14px;"></th>
              <td mat-cell *matCellDef="let p" style="padding:14px;">
                <button *ngIf="!p.delivree" mat-stroked-button
                        [disabled]="delivering.has(p.id)"
                        (click)="deliver(p)"
                        style="border-color:#6C3483;color:#6C3483;border-radius:6px;
                               font-size:12px;">
                  <mat-progress-spinner *ngIf="delivering.has(p.id)" diameter="14" mode="indeterminate" style="display:inline-block;margin-right:6px;vertical-align:middle;"></mat-progress-spinner>
                  <mat-icon *ngIf="!delivering.has(p.id)" style="font-size:14px;">check</mat-icon>
                  {{delivering.has(p.id) ? 'Livraison...' : 'Délivrer'}}
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols" style="background:#F5F6FA;"></tr>
            <tr mat-row *matRowDef="let r; columns: cols;"
                style="border-bottom:1px solid #F5F6FA;"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[10, 25, 50]" pageSize="10"
                         showFirstLastButtons></mat-paginator>

          <div *ngIf="!loading && dataSource.filteredData.length === 0" class="empty-state" style="padding:48px;">
            <mat-icon>description</mat-icon>
            <h3>Aucune ordonnance</h3>
          </div>
        </mat-card>
      </main>
    </div>
  `
})
export class PrescriptionsComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  auth     = inject(AuthService);
  private api      = inject(ApiService);
  private notification = inject(NotificationService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading      = true;
  all: Prescription[] = [];
  dataSource = new MatTableDataSource<Prescription>([]);
  delivering = new Set<number>();
  searchText   = '';
  filterStatus = '';
  cols = ['date','patient','medicaments','code','statut','action'];

  ngOnInit(): void {
    this.configureFilterPredicate();
    this.api.get<Prescription[]>('/api/pharmacy/prescriptions').pipe(takeUntil(this.destroy$)).subscribe({
      next: (d) => {
        this.all = d ?? [];
        this.dataSource.data = this.all;
        this.loading = false;
        this.applyFilter();
      },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  applyFilter(): void {
    const filterValue = JSON.stringify({
      text: this.searchText.trim().toLowerCase(),
      status: this.filterStatus
    });
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  deliver(p: Prescription): void {
    if (this.delivering.has(p.id)) return;
    this.delivering.add(p.id);
    this.api.patch<Prescription>(`/api/pharmacy/prescriptions/${p.id}/delivered`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.all = this.all.map(x => x.id === p.id ? updated : x);
        this.dataSource.data = this.all;
        this.applyFilter();
        this.delivering.delete(p.id);
        this.notification.success('Ordonnance délivrée ✅', 3000);
      },
      error: (err) => {
        this.delivering.delete(p.id);
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
      }
    });
  }

  exportCsv(): void {
    const header = 'Date,Patient,Médicaments,Code Retrait,Statut';
    const rows = this.dataSource.filteredData.map(p =>
      `${this.formatDate(p.createdAt)},"${p.patientPrenom} ${p.patientNom}","${p.medicaments}",${p.codeRetrait},${p.delivree ? 'Délivrée' : 'En attente'}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordonnances_${new Date().toLocaleDateString('fr-FR').replace(/\//g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private configureFilterPredicate(): void {
    this.dataSource.filterPredicate = (p, rawFilter) => {
      const filter = JSON.parse(rawFilter || '{"text":"","status":""}') as { text: string; status: string };
      const txt = filter.text;
      const matchTxt = !txt ||
        p.patientNom?.toLowerCase().includes(txt) ||
        p.patientPrenom?.toLowerCase().includes(txt) ||
        p.medecinNom?.toLowerCase().includes(txt) ||
        p.codeRetrait?.toLowerCase().includes(txt);
      const matchStatus =
        filter.status === '' ? true :
        filter.status === 'pending'   ? !p.delivree :
        filter.status === 'delivered' ?  p.delivree : true;
      return matchTxt && matchStatus;
    };
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR',
      { day:'2-digit', month:'short', year:'numeric' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
