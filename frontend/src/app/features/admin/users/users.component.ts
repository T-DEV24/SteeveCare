// src/app/features/admin/users/users.component.ts
import { AfterViewInit, Component, OnDestroy, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';
import { Subject, takeUntil } from 'rxjs';

interface UserRow {
  id: number; email: string; nom: string; prenom: string;
  telephone: string; role: string; status: string; createdAt: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [InitialsPipe, SidebarComponent,
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule, MatCardModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div style="display:flex;min-height:100vh;">

      <!-- ═══ SIDEBAR ═══ -->
      <app-sidebar [role]="'admin'" [activeRoute]="'/admin/users'"></app-sidebar>

      <!-- ═══ CONTENU ═══ -->
      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <h1>Gestion des utilisateurs</h1>
          <button mat-raised-button routerLink="/admin/create-user"
                  style="background:#1A5276;color:white;border-radius:8px;">
            <mat-icon>person_add</mat-icon> Nouveau compte
          </button>
        </div>

        <!-- Filtres -->
        <mat-card style="padding:20px;margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr 200px 200px;gap:16px;align-items:center;">
            <mat-form-field appearance="outline" style="margin:0;">
              <mat-label>Rechercher nom / email</mat-label>
              <input matInput [(ngModel)]="searchText" (input)="applyFilter()"
                     placeholder="Ex: dupont ou dr.martin@...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" style="margin:0;">
              <mat-label>Rôle</mat-label>
              <mat-select [(ngModel)]="filterRole" (selectionChange)="applyFilter()">
                <mat-option value="">Tous les rôles</mat-option>
                <mat-option *ngFor="let r of roles; trackBy: trackByItem" [value]="r">{{r}}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="margin:0;">
              <mat-label>Statut</mat-label>
              <mat-select [(ngModel)]="filterStatus" (selectionChange)="applyFilter()">
                <mat-option value="">Tous les statuts</mat-option>
                <mat-option *ngFor="let s of statuses; trackBy: trackByItem" [value]="s">{{s}}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div style="margin-top:10px;font-size:13px;color:#7F8C8D;">
            {{dataSource.filteredData.length}} utilisateur(s) trouvé(s)
          </div>
        </mat-card>

        <!-- Tableau -->
        <mat-card style="overflow:hidden;padding:0;">
          <div *ngIf="loading" style="text-align:center;padding:48px;">
            <mat-progress-spinner mode="indeterminate" diameter="40"
                                  style="margin:0 auto;"></mat-progress-spinner>
          </div>

          <table *ngIf="!loading" mat-table matSort [dataSource]="dataSource"
                 style="width:100%;">

            <!-- Col 1 : Utilisateur -->
            <ng-container matColumnDef="utilisateur">
              <th mat-header-cell *matHeaderCellDef mat-sort-header
                  style="padding:16px;font-weight:600;color:#7F8C8D;font-size:12px;
                         text-transform:uppercase;letter-spacing:0.5px;">
                Utilisateur
              </th>
              <td mat-cell *matCellDef="let u" style="padding:16px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div class="avatar"
                       [style.background]="getRoleColor(u.role)">
                    {{ u.nom | initials:u.prenom }}
                  </div>
                  <div>
                    <div style="font-weight:500;color:#2C3E50;">
                      {{u.prenom}} {{u.nom}}
                    </div>
                    <div style="font-size:12px;color:#7F8C8D;">{{u.email}}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Col 2 : Rôle -->
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef mat-sort-header
                  style="padding:16px;font-weight:600;color:#7F8C8D;
                         font-size:12px;text-transform:uppercase;">Rôle</th>
              <td mat-cell *matCellDef="let u" style="padding:16px;">
                <span class="badge-role" [class]="'badge-'+u.role">{{u.role}}</span>
              </td>
            </ng-container>

            <!-- Col 3 : Statut -->
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef mat-sort-header
                  style="padding:16px;font-weight:600;color:#7F8C8D;
                         font-size:12px;text-transform:uppercase;">Statut</th>
              <td mat-cell *matCellDef="let u" style="padding:16px;">
                <span class="badge-status" [class]="'badge-'+u.status">{{u.status}}</span>
              </td>
            </ng-container>

            <!-- Col 4 : Date -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header
                  style="padding:16px;font-weight:600;color:#7F8C8D;
                         font-size:12px;text-transform:uppercase;">Inscription</th>
              <td mat-cell *matCellDef="let u" style="padding:16px;color:#7F8C8D;font-size:13px;">
                {{formatDate(u.createdAt)}}
              </td>
            </ng-container>

            <!-- Col 5 : Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="padding:16px;">Actions</th>
              <td mat-cell *matCellDef="let u" style="padding:16px;">
                <div style="display:flex;gap:6px;align-items:center;">

                  <!-- Geler -->
                  <button *ngIf="u.status === 'ACTIVE'" mat-icon-button
                          aria-label="Geler le compte"
                          matTooltip="Geler le compte"
                          (click)="freeze(u)"
                          [disabled]="actionLoading === u.id"
                          style="color:#2980B9;">
                    <mat-icon>ac_unit</mat-icon>
                  </button>

                  <!-- Dégeler -->
                  <button *ngIf="u.status === 'FROZEN'" mat-icon-button
                          aria-label="Dégeler le compte"
                          matTooltip="Dégeler le compte"
                          (click)="unfreeze(u)"
                          [disabled]="actionLoading === u.id"
                          style="color:#27AE60;">
                    <mat-icon>play_circle</mat-icon>
                  </button>

                  <!-- Supprimer (SUPER_ADMIN uniquement) -->
                  <button *ngIf="auth.userRole() === 'SUPER_ADMIN'" mat-icon-button
                          aria-label="Supprimer définitivement"
                          matTooltip="Supprimer définitivement"
                          (click)="confirmDelete(u)"
                          [disabled]="actionLoading === u.id"
                          style="color:#E74C3C;">
                    <mat-icon>delete_forever</mat-icon>
                  </button>

                  <!-- Spinner d'action -->
                  <mat-progress-spinner *ngIf="actionLoading === u.id"
                                        diameter="20" mode="indeterminate"
                                        style="display:inline-block;"></mat-progress-spinner>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"
                style="background:#F5F6FA;"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                style="border-bottom:1px solid #F5F6FA;transition:background 0.15s;"
                onmouseenter="this.style.background='#FAFBFC'"
                onmouseleave="this.style.background='white'"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[10, 25, 50]" pageSize="10"
                         showFirstLastButtons></mat-paginator>
        </mat-card>
      </main>
    </div>

    <!-- Overlay confirmation suppression -->
    <div *ngIf="userToDelete" class="overlay-backdrop" (click)="userToDelete=null">
      <div class="overlay-dialog" (click)="$event.stopPropagation()">
        <div style="text-align:center;margin-bottom:20px;">
          <mat-icon style="font-size:48px;color:#E74C3C;width:48px;height:48px;">
            warning
          </mat-icon>
          <h2 style="color:#E74C3C;margin-top:8px;">Suppression définitive</h2>
          <p style="color:#7F8C8D;font-size:14px;margin-top:8px;">
            Vous êtes sur le point de supprimer définitivement le compte de<br>
            <strong style="color:#2C3E50;">
              {{userToDelete.prenom}} {{userToDelete.nom}}
            </strong><br>
            <span style="font-size:12px;">Cette action est irréversible.</span>
          </p>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button mat-stroked-button (click)="userToDelete=null"
                  style="border-radius:8px;min-width:100px;">Annuler</button>
          <button mat-raised-button (click)="deleteUser()"
                  style="background:#E74C3C;color:white;border-radius:8px;min-width:100px;">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  auth    = inject(AuthService);
  private api      = inject(ApiService);
  private notification = inject(NotificationService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading       = true;
  actionLoading: number | null = null;
  userToDelete: UserRow | null = null;

  searchText   = '';
  filterRole   = '';
  filterStatus = '';

  roles    = ['PATIENT','DOCTOR','PHARMACY','ADMIN','GESTIONNAIRE','SUPER_ADMIN'];
  statuses = ['ACTIVE','PENDING','FROZEN','DELETED'];
  displayedColumns = ['utilisateur','role','statut','date','actions'];

  dataSource = new MatTableDataSource<UserRow>([]);
  private allUsers: UserRow[] = [];

  constructor() {
    this.dataSource.sortingDataAccessor = (user, column) => {
      switch (column) {
        case 'utilisateur': return `${user.prenom} ${user.nom} ${user.email}`.toLowerCase();
        case 'statut': return user.status;
        case 'date': return new Date(user.createdAt).getTime();
        default: return (user as any)[column] ?? '';
      }
    };
  }

  ngOnInit(): void { this.loadUsers(); }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.loading = true;
    this.api.get<UserRow[]>('/api/admin/users').pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.allUsers = data;
        this.dataSource.data = data;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    this.dataSource.data = this.allUsers.filter(u => {
      const txt = this.searchText.toLowerCase();
      const matchText = !txt ||
        (u.nom?.toLowerCase().includes(txt)) ||
        (u.prenom?.toLowerCase().includes(txt)) ||
        (u.email?.toLowerCase().includes(txt));
      const matchRole   = !this.filterRole   || u.role   === this.filterRole;
      const matchStatus = !this.filterStatus || u.status === this.filterStatus;
      return matchText && matchRole && matchStatus;
    });
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  freeze(u: UserRow): void {
    this.actionLoading = u.id;
    this.api.patch(`/api/admin/users/${u.id}/freeze`).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notification.warning(`Compte de ${u.prenom} ${u.nom} gelé ❄️`, 3000);
        this.loadUsers();
        this.actionLoading = null;
      },
      error: (err) => {
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
        this.actionLoading = null;
      }
    });
  }

  unfreeze(u: UserRow): void {
    this.actionLoading = u.id;
    this.api.patch(`/api/admin/users/${u.id}/unfreeze`).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notification.success(`Compte de ${u.prenom} ${u.nom} dégelé ▶️`, 3000);
        this.loadUsers();
        this.actionLoading = null;
      },
      error: (err) => {
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
        this.actionLoading = null;
      }
    });
  }

  confirmDelete(u: UserRow): void { this.userToDelete = u; }

  deleteUser(): void {
    if (!this.userToDelete) return;
    const u = this.userToDelete;
    this.userToDelete = null;
    this.actionLoading = u.id;
    this.api.delete(`/api/admin/delete/${u.id}`).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notification.success(`Compte supprimé définitivement`, 3000);
        this.loadUsers();
        this.actionLoading = null;
      },
      error: (err) => {
        this.notification.error(err.error?.erreur ?? 'Erreur', 4000);
        this.actionLoading = null;
      }
    });
  }


  getRoleColor(role: string): string {
    const c: Record<string,string> = {
      PATIENT:'#27AE60', DOCTOR:'#2980B9', PHARMACY:'#8E44AD',
      ADMIN:'#E67E22', GESTIONNAIRE:'#F1C40F', SUPER_ADMIN:'#E74C3C'
    };
    return c[role] ?? '#7F8C8D';
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day:'2-digit', month:'2-digit', year:'numeric'
    });
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
