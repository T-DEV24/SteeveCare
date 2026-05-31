// src/app/features/patient/doctors/doctors.component.ts
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';
import { Subject, takeUntil } from 'rxjs';

interface Doctor {
  id: number; userId: number; nom: string; prenom: string; specialite: string;
  biographie: string; tarif: number; ville: string; anneesExperience: number;
  photoUrl?: string;
}

@Component({
  selector: 'app-doctor-search',
  standalone: true,
  imports: [InitialsPipe, SidebarComponent,
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div style="display:flex;min-height:100vh;">

      <!-- SIDEBAR -->
      <app-sidebar [role]="'patient'" [activeRoute]="'/patient/doctors'"></app-sidebar>

      <!-- CONTENU -->
      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <h1>Trouver un médecin</h1>
        </div>

        <!-- Barre de recherche -->
        <mat-card style="padding:20px;margin-bottom:24px;">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:16px;align-items:center;">
            <mat-form-field appearance="outline" style="margin:0;">
              <mat-label>Recherche</mat-label>
              <input matInput [(ngModel)]="searchText" placeholder="Nom, prénom ou spécialité">
            </mat-form-field>
            <mat-form-field appearance="outline" style="margin:0;">
              <mat-label>Spécialité</mat-label>
              <mat-select [(ngModel)]="filterSpec">
                <mat-option value="">Toutes les spécialités</mat-option>
                <mat-option *ngFor="let s of specialites; trackBy: trackByItem" [value]="s">{{s}}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="margin:0;">
              <mat-label>Ville</mat-label>
              <mat-select [(ngModel)]="filterVille">
                <mat-option value="">Toutes les villes</mat-option>
                <mat-option *ngFor="let v of villes; trackBy: trackByItem" [value]="v">{{v}}</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button (click)="search()"
                    style="background:#1A5276;color:white;border-radius:8px;height:56px;padding:0 24px;">
              <mat-icon>search</mat-icon> Rechercher
            </button>
          </div>
        </mat-card>

        <!-- Compteur -->
        <div style="margin-bottom:16px;color:#7F8C8D;font-size:13px;">
          <strong style="color:#2C3E50;">{{pagedDoctors.length}}</strong>
          médecin(s) trouvé(s) sur {{filteredDoctors.length}}
        </div>

        <!-- Spinner -->
        <div *ngIf="loading" style="text-align:center;padding:60px;">
          <mat-progress-spinner mode="indeterminate" diameter="48" style="margin:0 auto;"></mat-progress-spinner>
        </div>

        <!-- Grille médecins -->
        <div *ngIf="!loading"
             style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">
          <mat-card *ngFor="let d of pagedDoctors; trackBy: trackByItem"
                    style="padding:24px;display:flex;flex-direction:column;gap:12px;">
            <!-- Avatar + Nom -->
            <div style="display:flex;align-items:center;gap:14px;">
              <div class="avatar avatar-lg"
                   [style.background]="getAvatarColor(d.specialite)">
                {{ d.nom | initials:d.prenom }}
              </div>
              <div>
                <div style="font-weight:600;font-size:16px;color:#2C3E50;">
                  Dr. {{d.prenom}} {{d.nom}}
                </div>
                <span style="background:#D6EAF8;color:#1A5276;padding:2px 10px;
                             border-radius:20px;font-size:11px;font-weight:600;">
                  {{d.specialite}}
                </span>
              </div>
            </div>

            <!-- Infos -->
            <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#7F8C8D;">
              <div style="display:flex;align-items:center;gap:6px;">
                <mat-icon style="font-size:16px;width:16px;">location_on</mat-icon>
                {{d.ville}}
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <mat-icon style="font-size:16px;width:16px;">payments</mat-icon>
                <strong style="color:#2C3E50;">{{d.tarif | number}} FCFA</strong> / consultation
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <mat-icon style="font-size:16px;width:16px;">workspace_premium</mat-icon>
                {{d.anneesExperience}} ans d'expérience
              </div>
            </div>

            <!-- Étoiles -->
            <div style="display:flex;gap:2px;">
              <mat-icon *ngFor="let s of getStars(d); trackBy: trackByItem" style="color:#F39C12;font-size:16px;width:16px;">
                {{s}}
              </mat-icon>
            </div>

            <!-- Biographie -->
            <p *ngIf="d.biographie"
               style="font-size:12px;color:#7F8C8D;line-height:1.5;
                      border-top:1px solid #F5F6FA;padding-top:10px;margin:0;">
              {{d.biographie | slice:0:120}}{{d.biographie.length > 120 ? '...' : ''}}
            </p>

            <!-- Boutons -->
            <div style="display:flex;gap:8px;margin-top:auto;">
              <button mat-stroked-button style="flex:1;border-radius:8px;font-size:13px;">
                <mat-icon style="font-size:16px;">info</mat-icon> Profil
              </button>
              <button mat-raised-button (click)="openRdvDialog(d)"
                      style="flex:1;border-radius:8px;background:#1A5276;
                             color:white;font-size:13px;">
                <mat-icon style="font-size:16px;">event_available</mat-icon> RDV
              </button>
            </div>
          </mat-card>
        </div>

        <!-- État vide -->
        <div *ngIf="!loading && filteredDoctors.length === 0" class="empty-state">
          <mat-icon>person_search</mat-icon>
          <h3>Aucun médecin trouvé</h3>
          <p>Essayez d'autres critères de recherche</p>
        </div>

        <!-- Pagination -->
        <div *ngIf="totalPages > 1"
             style="display:flex;justify-content:center;align-items:center;
                    gap:8px;margin-top:28px;">
          <button mat-icon-button [disabled]="currentPage === 0"
                  aria-label="Page précédente"
                  (click)="changePage(currentPage-1)">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button *ngFor="let p of pageNumbers; trackBy: trackByItem" mat-icon-button
                  [attr.aria-label]="'Aller à la page ' + (p + 1)"
                  (click)="changePage(p)"
                  [style.background]="p === currentPage ? '#1A5276' : 'transparent'"
                  [style.color]="p === currentPage ? 'white' : 'inherit'"
                  style="border-radius:8px;width:36px;height:36px;">
            {{p + 1}}
          </button>
          <button mat-icon-button [disabled]="currentPage === totalPages - 1"
                  aria-label="Page suivante"
                  (click)="changePage(currentPage+1)">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </main>
    </div>

    <!-- DIALOG PRISE DE RDV -->
    <div *ngIf="showDialog" class="overlay-backdrop" (click)="showDialog=false">
      <div class="overlay-dialog" (click)="$event.stopPropagation()">
        <h2>📅 Prendre rendez-vous</h2>

        <div *ngIf="selectedDoctor"
             style="display:flex;align-items:center;gap:12px;
                    background:#F5F6FA;border-radius:10px;padding:14px;margin-bottom:20px;">
          <div class="avatar" [style.background]="getAvatarColor(selectedDoctor.specialite)">
            {{ selectedDoctor.nom | initials:selectedDoctor.prenom }}
          </div>
          <div>
            <div style="font-weight:600;">Dr. {{selectedDoctor.prenom}} {{selectedDoctor.nom}}</div>
            <div style="font-size:12px;color:#7F8C8D;">{{selectedDoctor.specialite}} — {{selectedDoctor.ville}}</div>
            <div style="font-size:12px;color:#27AE60;font-weight:500;">{{selectedDoctor.tarif | number}} FCFA</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label style="font-size:13px;font-weight:500;color:#2C3E50;display:block;margin-bottom:6px;">
              Date et heure *
            </label>
            <input type="datetime-local" [(ngModel)]="rdvDate" [min]="minDateTime"
                   style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;
                          font-size:14px;outline:none;font-family:inherit;">
          </div>

          <div>
            <label style="font-size:13px;font-weight:500;color:#2C3E50;display:block;margin-bottom:6px;">
              Type de consultation *
            </label>
            <select [(ngModel)]="rdvType"
                    style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;
                           font-size:14px;outline:none;font-family:inherit;">
              <option value="">-- Choisir --</option>
              <option value="VIDEO">📹 Vidéoconsultation</option>
              <option value="MESSAGING">💬 Messagerie médicale</option>
            </select>
          </div>

          <div>
            <label style="font-size:13px;font-weight:500;color:#2C3E50;display:block;margin-bottom:6px;">
              Motif de la consultation * (min. 10 caractères)
            </label>
            <textarea [(ngModel)]="rdvMotif" rows="3"
                      placeholder="Décrivez brièvement votre problème de santé..."
                      style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;
                             font-size:14px;outline:none;font-family:inherit;resize:vertical;">
            </textarea>
            <span style="font-size:11px;color:#7F8C8D;">{{rdvMotif.length}}/500</span>
          </div>

          <div style="display:flex;gap:12px;margin-top:8px;">
            <button mat-stroked-button (click)="showDialog=false"
                    style="flex:1;border-radius:8px;">Annuler</button>
            <button mat-raised-button (click)="confirmRdv()"
                    [disabled]="!rdvDate || !rdvType || rdvMotif.length < 10 || rdvLoading"
                    style="flex:1;background:#1A5276;color:white;border-radius:8px;">
              <span *ngIf="!rdvLoading">✅ Confirmer</span>
              <span *ngIf="rdvLoading" style="display:flex;align-items:center;gap:6px;justify-content:center;">
                <mat-progress-spinner diameter="16" mode="indeterminate" color="accent"></mat-progress-spinner>
                Envoi...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DoctorSearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  auth     = inject(AuthService);
  private api      = inject(ApiService);
  private notification = inject(NotificationService);
  private router   = inject(Router);

  loading = true;
  allDoctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  searchText = '';

  filterSpec  = '';
  filterVille = '';

  // Pagination
  currentPage = 0;
  pageSize    = 10;
  get totalPages()  { return Math.ceil(this.filteredDoctors.length / this.pageSize); }
  get pagedDoctors(){ return this.filteredDoctors.slice(this.currentPage * this.pageSize, (this.currentPage+1)*this.pageSize); }
  get pageNumbers() { return Array.from({length: this.totalPages}, (_, i) => i); }

  // Dialog RDV
  showDialog: boolean = false;
  selectedDoctor: Doctor | null = null;
  rdvDate   = '';
  rdvType   = '';
  rdvMotif  = '';
  rdvLoading = false;
  get minDateTime() {
    const d = new Date(Date.now() + 60*60*1000);
    return d.toISOString().slice(0,16);
  }

  specialites = ['Généraliste','Cardiologue','Pédiatre','Dermatologue',
                 'Gynécologue','Ophtalmologue','Chirurgien','Neurologue','Psychiatre','Urgentiste'];
  villes = ['Yaoundé','Douala','Bafoussam','Garoua','Bamenda',
            'Maroua','Ngaoundéré','Bertoua','Ebolowa','Kribi'];

  ngOnInit(): void { this.search(); }

  search(): void {
    this.loading = true;
    this.currentPage = 0;
    const params: Record<string,string> = {};
    if (this.filterSpec)  params['specialite'] = this.filterSpec;
    if (this.filterVille) params['ville']       = this.filterVille;

    this.api.get<Doctor[]>('/api/doctors/search', params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.allDoctors = data;
        this.applyLocalFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyLocalFilter(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredDoctors = this.allDoctors.filter(doc => {
      if (!q) return true;
      return (doc.nom ?? '').toLowerCase().includes(q) ||
        (doc.prenom ?? '').toLowerCase().includes(q) ||
        (doc.specialite ?? '').toLowerCase().includes(q);
    });
  }

  changePage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.currentPage = p;
  }

  openRdvDialog(d: Doctor): void {
    this.selectedDoctor = d;
    this.rdvDate = '';
    this.rdvType = '';
    this.rdvMotif = '';
    this.showDialog = true;
  }

  confirmRdv(): void {
    if (!this.selectedDoctor || this.rdvLoading) return;
    this.rdvLoading = true;
    const body = {
      doctorId: this.selectedDoctor.userId,
      dateHeure: new Date(this.rdvDate).toISOString(),
      type: this.rdvType,
      motif: this.rdvMotif
    };
    this.api.post('/api/appointments', body).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.rdvLoading = false;
        this.showDialog = false;
        this.notification.success('✅ Rendez-vous pris avec succès !', 4000);
        this.router.navigate(['/patient/appointments']);
      },
      error: (err) => {
        this.rdvLoading = false;
        this.notification.error(err.error?.erreur ?? 'Erreur lors de la prise de RDV', 5000);
      }
    });
  }


  getAvatarColor(spec: string): string {
    const colors = ['#1A5276','#27AE60','#8E44AD','#E67E22','#2980B9','#C0392B'];
    return colors[spec?.length % colors.length] ?? '#1A5276';
  }

  getStars(d: Doctor): string[] {
    const n = d.tarif % 2 === 0 ? 4 : 5;
    return [...Array(n).fill('star'), ...Array(5-n).fill('star_border')];
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
