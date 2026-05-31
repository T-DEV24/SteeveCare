// src/app/features/admin/users/users.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';

interface UserRow {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: string;
  status: string;
  createdAt: string;
  ville?: string;
}

interface PageResponse<T> {
  content?: T[];
  items?: T[];
  data?: T[];
  totalElements?: number;
  total?: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [InitialsPipe, SidebarComponent, CommonModule, RouterModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatProgressSpinnerModule, MatSelectModule, MatSidenavModule, MatSnackBarModule, MatTableModule, MatTooltipModule],
  template: `
    <div class="users-layout">
      <app-sidebar [role]="'admin'" [activeRoute]="'/admin/users'"></app-sidebar>

      <mat-sidenav-container class="users-container">
        <mat-sidenav-content>
          <main class="main-content users-page">
            <header class="page-hero">
              <div>
                <p class="hero-kicker">Administration</p>
                <h1>Gestion des utilisateurs</h1>
                <p>Recherche, édition rapide, suspension et pagination serveur.</p>
              </div>
              <button mat-raised-button routerLink="/admin/create-user"><mat-icon>person_add</mat-icon>Nouveau compte</button>
            </header>

            <mat-card class="filters-card">
              <div class="filters-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Rechercher nom / email</mat-label>
                  <input matInput [(ngModel)]="searchText" (ngModelChange)="onFiltersChanged()" placeholder="Ex: dupont ou dr.martin@...">
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Rôle</mat-label>
                  <mat-select [(ngModel)]="filterRole" (selectionChange)="onFiltersChanged()">
                    <mat-option value="">Tous les rôles</mat-option>
                    <mat-option *ngFor="let role of roles; trackBy: trackByValue" [value]="role">{{role}}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Statut</mat-label>
                  <mat-select [(ngModel)]="filterStatus" (selectionChange)="onFiltersChanged()">
                    <mat-option value="">Tous les statuts</mat-option>
                    <mat-option *ngFor="let status of statuses; trackBy: trackByValue" [value]="status">{{status}}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card>

            <mat-card class="table-card">
              <div *ngIf="loading" class="loading-state"><mat-progress-spinner diameter="42" mode="indeterminate"></mat-progress-spinner></div>
              <table *ngIf="!loading" mat-table [dataSource]="users">
                <ng-container matColumnDef="utilisateur">
                  <th mat-header-cell *matHeaderCellDef>Utilisateur</th>
                  <td mat-cell *matCellDef="let user">
                    <div class="user-cell"><div class="avatar" [style.background]="getRoleColor(user.role)">{{user.nom | initials:user.prenom}}</div><div><strong>{{user.prenom}} {{user.nom}}</strong><span>{{user.email}}</span></div></div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="role"><th mat-header-cell *matHeaderCellDef>Rôle</th><td mat-cell *matCellDef="let user"><span class="role-pill">{{user.role}}</span></td></ng-container>
                <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let user"><span class="status-pill" [class.pending]="user.status === 'PENDING'" [class.frozen]="user.status === 'FROZEN'">{{user.status}}</span></td></ng-container>
                <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let user">{{formatDate(user.createdAt)}}</td></ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let user">
                    <button mat-icon-button color="primary" matTooltip="Voir / éditer" (click)="openDrawer(user)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" matTooltip="Suspendre le compte" [disabled]="actionLoading === user.id || user.status === 'FROZEN'" (click)="confirmSuspend(user)"><mat-icon>block</mat-icon></button>
                    <button mat-icon-button matTooltip="Réactiver" [disabled]="actionLoading === user.id || user.status !== 'FROZEN'" (click)="unfreeze(user)"><mat-icon>play_circle</mat-icon></button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns" (click)="openDrawer(row)"></tr>
              </table>
              <mat-paginator [length]="totalUsers" [pageIndex]="page" [pageSize]="size" [pageSizeOptions]="[10,20,50]" (page)="onPage($event)"></mat-paginator>
            </mat-card>
          </main>
        </mat-sidenav-content>

        <mat-sidenav #drawer position="end" mode="over" class="profile-drawer">
          <ng-container *ngIf="selectedUser">
            <div class="drawer-header">
              <div class="avatar avatar-lg" [style.background]="getRoleColor(selectedUser.role)">{{selectedUser.nom | initials:selectedUser.prenom}}</div>
              <div><h2>{{selectedUser.prenom}} {{selectedUser.nom}}</h2><p>{{selectedUser.email}}</p></div>
              <button mat-icon-button (click)="drawer.close()"><mat-icon>close</mat-icon></button>
            </div>
            <div class="drawer-form">
              <mat-form-field appearance="outline"><mat-label>Prénom</mat-label><input matInput [(ngModel)]="selectedUser.prenom"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Nom</mat-label><input matInput [(ngModel)]="selectedUser.nom"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput [(ngModel)]="selectedUser.email"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Téléphone</mat-label><input matInput [(ngModel)]="selectedUser.telephone"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Ville</mat-label><input matInput [(ngModel)]="selectedUser.ville"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Rôle</mat-label><mat-select [(ngModel)]="selectedUser.role"><mat-option *ngFor="let role of roles; trackBy: trackByValue" [value]="role">{{role}}</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Statut</mat-label><mat-select [(ngModel)]="selectedUser.status"><mat-option *ngFor="let status of statuses; trackBy: trackByValue" [value]="status">{{status}}</mat-option></mat-select></mat-form-field>
              <div class="drawer-actions"><button mat-stroked-button (click)="drawer.close()">Annuler</button><button mat-raised-button color="primary" [disabled]="actionLoading === selectedUser.id" (click)="saveSelectedUser()"><mat-icon>save</mat-icon>Enregistrer</button></div>
            </div>
          </ng-container>
        </mat-sidenav>
      </mat-sidenav-container>

      <div *ngIf="userToSuspend" class="overlay-backdrop" (click)="userToSuspend=null">
        <div class="overlay-dialog" (click)="$event.stopPropagation()">
          <mat-icon>block</mat-icon><h2>Suspendre le compte ?</h2>
          <p>Confirmer la suspension de <strong>{{userToSuspend.prenom}} {{userToSuspend.nom}}</strong>.</p>
          <div><button mat-stroked-button (click)="userToSuspend=null">Annuler</button><button mat-raised-button color="warn" (click)="suspendConfirmed()">Suspendre</button></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block}.users-layout{display:flex;min-height:100vh;background:#F4F8FB}.users-container{flex:1;background:transparent}.users-page{padding:24px}.page-hero{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:28px;margin-bottom:24px;color:white;border-radius:28px;background:linear-gradient(135deg,#0D3349,#1A5276 55%,#1E8449)}.hero-kicker{margin:0 0 6px;color:#8EF2B3;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase}.page-hero h1{margin:0 0 8px;font-size:clamp(2rem,4vw,3.3rem);font-weight:900}.page-hero p:last-child{margin:0;color:rgba(255,255,255,.84)}.page-hero button{background:white;color:#1A5276}.filters-card,.table-card{border-radius:22px!important;box-shadow:0 14px 44px rgba(13,51,73,.08)!important}.filters-card{padding:20px;margin-bottom:20px}.filters-grid{display:grid;grid-template-columns:1fr 220px 220px;gap:16px}.table-card{overflow:hidden}.loading-state{display:grid;place-items:center;padding:54px}table{width:100%}th{color:#7F8C8D;font-size:12px;text-transform:uppercase;letter-spacing:.6px}td,th{padding:14px!important}.user-cell{display:flex;align-items:center;gap:12px}.user-cell strong{display:block;color:#2C3E50}.user-cell span{font-size:12px;color:#7F8C8D}.avatar{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;color:white;font-weight:900}.avatar-lg{width:64px;height:64px;font-size:22px}.role-pill,.status-pill{display:inline-flex;width:fit-content;padding:4px 10px;border-radius:999px;color:#1A5276;background:#D6EAF8;font-weight:800;font-size:12px}.status-pill.pending{color:#B9770E;background:#FDEBD0}.status-pill.frozen{color:#C0392B;background:#FADBD8}tr.mat-mdc-row{cursor:pointer}.profile-drawer{width:min(440px,92vw);padding:0}.drawer-header{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:22px;color:white;background:linear-gradient(135deg,#1A5276,#1E8449)}.drawer-header h2{margin:0}.drawer-header p{margin:4px 0 0;color:rgba(255,255,255,.78)}.drawer-form{display:grid;gap:12px;padding:22px}.drawer-actions{display:flex;justify-content:flex-end;gap:10px}.overlay-backdrop{position:fixed;inset:0;z-index:3000;background:rgba(13,37,51,.48);display:grid;place-items:center}.overlay-dialog{width:min(420px,92vw);padding:28px;border-radius:22px;background:white;text-align:center;box-shadow:0 20px 70px rgba(0,0,0,.28)}.overlay-dialog>mat-icon{font-size:46px;width:46px;height:46px;color:#E74C3C}.overlay-dialog h2{color:#C0392B}.overlay-dialog div{display:flex;justify-content:center;gap:12px}@media(max-width:850px){.filters-grid{grid-template-columns:1fr}.page-hero{align-items:flex-start;flex-direction:column}.page-hero button{width:100%}}
  `]
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly filter$ = new Subject<void>();
  private readonly api = inject(ApiService);
  private readonly notification = inject(NotificationService);
  auth = inject(AuthService);
  @ViewChild('drawer') drawer!: MatSidenav;

  loading = true;
  actionLoading: number | null = null;
  users: UserRow[] = [];
  selectedUser: UserRow | null = null;
  userToSuspend: UserRow | null = null;
  totalUsers = 0;
  page = 0;
  size = 10;
  searchText = '';
  filterRole = '';
  filterStatus = '';
  roles = ['PATIENT','DOCTOR','PHARMACY','ADMIN','GESTIONNAIRE','SUPER_ADMIN'];
  statuses = ['ACTIVE','PENDING','FROZEN','DELETED'];
  displayedColumns = ['utilisateur','role','statut','date','actions'];

  ngOnInit(): void {
    this.filter$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => { this.page = 0; this.loadUsers(); });
    this.loadUsers();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadUsers(): void {
    this.loading = true;
    const params: Record<string, string | number> = { page: this.page, size: this.size };
    if (this.searchText.trim()) params['search'] = this.searchText.trim();
    if (this.filterRole) params['role'] = this.filterRole;
    if (this.filterStatus) params['status'] = this.filterStatus;
    this.api.get<PageResponse<UserRow> | UserRow[]>('/api/admin/users', params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { const page = res as PageResponse<UserRow>; this.users = Array.isArray(res) ? res : (page.content ?? page.items ?? page.data ?? []); this.totalUsers = Array.isArray(res) ? res.length : (page.totalElements ?? page.total ?? this.users.length); this.loading = false; },
      error: () => { this.loading = false; this.users = []; this.totalUsers = 0; }
    });
  }

  onFiltersChanged(): void { this.filter$.next(); }
  onPage(event: PageEvent): void { this.page = event.pageIndex; this.size = event.pageSize; this.loadUsers(); }
  openDrawer(user: UserRow): void { this.selectedUser = { ...user }; setTimeout(() => this.drawer.open()); }

  saveSelectedUser(): void {
    if (!this.selectedUser) return;
    this.actionLoading = this.selectedUser.id;
    this.api.put<UserRow>(`/api/admin/users/${this.selectedUser.id}`, this.selectedUser).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.notification.success('Utilisateur mis à jour.', 3000); this.actionLoading = null; this.drawer.close(); this.loadUsers(); },
      error: err => { this.notification.error(err.error?.erreur ?? 'Erreur lors de la mise à jour', 4000); this.actionLoading = null; }
    });
  }

  confirmSuspend(user: UserRow): void { this.userToSuspend = user; }
  suspendConfirmed(): void { if (!this.userToSuspend) return; const user = this.userToSuspend; this.userToSuspend = null; this.freeze(user); }
  freeze(user: UserRow): void { this.actionLoading = user.id; this.api.patch(`/api/admin/users/${user.id}/freeze`).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { this.notification.warning('Compte suspendu.', 3000); this.actionLoading = null; this.loadUsers(); }, error: err => { this.notification.error(err.error?.erreur ?? 'Erreur', 4000); this.actionLoading = null; } }); }
  unfreeze(user: UserRow): void { this.actionLoading = user.id; this.api.patch(`/api/admin/users/${user.id}/unfreeze`).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { this.notification.success('Compte réactivé.', 3000); this.actionLoading = null; this.loadUsers(); }, error: err => { this.notification.error(err.error?.erreur ?? 'Erreur', 4000); this.actionLoading = null; } }); }

  getRoleColor(role: string): string { const c: Record<string,string> = { PATIENT:'#27AE60', DOCTOR:'#2980B9', PHARMACY:'#8E44AD', ADMIN:'#E67E22', GESTIONNAIRE:'#F1C40F', SUPER_ADMIN:'#E74C3C' }; return c[role] ?? '#7F8C8D'; }
  formatDate(date: string): string { return date ? new Date(date).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'; }
  trackByValue(_: number, value: string): string { return value; }
}
