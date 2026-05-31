// src/app/features/patient/doctors/doctors.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';

interface Doctor {
  id: number;
  userId: number;
  nom: string;
  prenom: string;
  specialite: string;
  biographie?: string;
  tarif?: number;
  prixConsultation?: number;
  ville: string;
  anneesExperience?: number;
  photoUrl?: string;
  note?: number;
  rating?: number;
  distanceKm?: number;
  availableToday?: boolean;
  creneauxDisponibles?: Array<string | { dateHeure?: string; start?: string; available?: boolean }>;
}

type AvailabilityFilter = 'today' | 'this-week' | 'any';
type SortOption = 'rating' | 'name' | 'distance';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-doctor-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    InitialsPipe,
    SidebarComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="doctors-layout">
      <app-sidebar [role]="'patient'" [activeRoute]="'/patient/doctors'"></app-sidebar>

      <main class="main-content doctors-page">
        <header class="page-hero">
          <div>
            <p class="hero-kicker">Recherche médicale avancée</p>
            <h1>Trouver un médecin</h1>
            <p>Filtrez par spécialité, ville, disponibilité et choisissez le praticien qui vous convient.</p>
          </div>
          <img src="assets/brand/steevacare-logo.svg" alt="SteevaCare">
        </header>

        <mat-card class="filters-card">
          <div class="filters-grid">
            <mat-form-field appearance="outline">
              <mat-label>Recherche</mat-label>
              <input matInput [(ngModel)]="searchText" (ngModelChange)="applyLocalFilter()" placeholder="Nom, prénom ou spécialité">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Spécialité</mat-label>
              <mat-select [(ngModel)]="filterSpec" (selectionChange)="search()">
                <mat-option value="">Toutes les spécialités</mat-option>
                <mat-option *ngFor="let s of specialites; trackBy: trackByValue" [value]="s">{{s}}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Ville</mat-label>
              <mat-select [(ngModel)]="filterVille" (selectionChange)="search()">
                <mat-option value="">Toutes les villes</mat-option>
                <mat-option *ngFor="let v of villes; trackBy: trackByValue" [value]="v">{{v}}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Disponibilité</mat-label>
              <mat-select [(ngModel)]="availabilityFilter" (selectionChange)="applyLocalFilter()">
                <mat-option value="any">Toutes</mat-option>
                <mat-option value="today">Aujourd'hui</mat-option>
                <mat-option value="this-week">Cette semaine</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tri</mat-label>
              <mat-select [(ngModel)]="sortBy" (selectionChange)="applyLocalFilter()">
                <mat-option value="rating">Par note</mat-option>
                <mat-option value="name">Par nom</mat-option>
                <mat-option value="distance">Par distance</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-button-toggle-group [(ngModel)]="viewMode" aria-label="Mode d'affichage">
              <mat-button-toggle value="grid"><mat-icon>grid_view</mat-icon></mat-button-toggle>
              <mat-button-toggle value="list"><mat-icon>view_list</mat-icon></mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </mat-card>

        <div class="results-toolbar">
          <p><strong>{{pagedDoctors.length}}</strong> médecin(s) affiché(s) sur {{filteredDoctors.length}}</p>
          <button mat-stroked-button color="primary" type="button" (click)="search()">
            <mat-icon>refresh</mat-icon>
            Actualiser
          </button>
        </div>

        <div *ngIf="loading" class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
          <p>Recherche des médecins...</p>
        </div>

        <section *ngIf="!loading" class="doctors-results" [class.doctors-results--list]="viewMode === 'list'">
          <mat-card *ngFor="let doctor of pagedDoctors; trackBy: trackByItem" class="doctor-card" [class.doctor-card--list]="viewMode === 'list'">
            <div class="doctor-card__main">
              <div class="doctor-avatar" [style.background]="getAvatarColor(doctor.specialite)">
                <img *ngIf="doctor.photoUrl" [src]="doctor.photoUrl" [alt]="'Photo Dr ' + doctor.prenom + ' ' + doctor.nom">
                <span *ngIf="!doctor.photoUrl">{{ doctor.nom | initials:doctor.prenom }}</span>
              </div>

              <div class="doctor-info">
                <div class="doctor-title-row">
                  <div>
                    <h2>Dr. {{doctor.prenom}} {{doctor.nom}}</h2>
                    <span class="specialty-badge">{{doctor.specialite}}</span>
                  </div>
                  <span *ngIf="isAvailableToday(doctor)" class="availability-badge">Disponible aujourd'hui</span>
                </div>

                <p class="doctor-bio">{{doctor.biographie || 'Médecin partenaire SteevaCare disponible pour des consultations en ligne.'}}</p>

                <div class="doctor-meta">
                  <span><mat-icon>location_on</mat-icon>{{doctor.ville}}</span>
                  <span><mat-icon>payments</mat-icon>{{getConsultationPrice(doctor) | number}} FCFA</span>
                  <span><mat-icon>workspace_premium</mat-icon>{{doctor.anneesExperience || 1}} ans exp.</span>
                  <span><mat-icon>near_me</mat-icon>{{doctor.distanceKm ?? '—'}} km</span>
                </div>

                <div class="rating-row" [attr.aria-label]="'Note ' + getRating(doctor) + ' sur 5'">
                  <mat-icon *ngFor="let star of getStars(doctor); trackBy: trackByValue">{{star}}</mat-icon>
                  <strong>{{getRating(doctor) | number:'1.1-1'}}</strong>
                </div>
              </div>
            </div>

            <div class="doctor-actions">
              <button mat-stroked-button color="primary" [routerLink]="['/patient/doctors', doctor.id]">
                <mat-icon>visibility</mat-icon>
                Voir le profil
              </button>
              <button mat-raised-button color="primary" [routerLink]="['/patient/doctors', doctor.id]" [queryParams]="{ book: true }">
                <mat-icon>event_available</mat-icon>
                Prendre RDV
              </button>
            </div>
          </mat-card>
        </section>

        <mat-card *ngIf="!loading && filteredDoctors.length === 0" class="empty-state">
          <mat-icon>search_off</mat-icon>
          <h2>Aucun médecin trouvé</h2>
          <p>Essayez d'élargir vos critères de recherche.</p>
        </mat-card>

        <nav *ngIf="!loading && totalPages > 1" class="pagination" aria-label="Pagination médecins">
          <button mat-icon-button type="button" [disabled]="currentPage === 0" (click)="changePage(currentPage - 1)">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button mat-button type="button" *ngFor="let p of pageNumbers; trackBy: trackByIndex" [class.active]="p === currentPage" (click)="changePage(p)">
            {{p + 1}}
          </button>
          <button mat-icon-button type="button" [disabled]="currentPage >= totalPages - 1" (click)="changePage(currentPage + 1)">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </nav>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .doctors-layout { display: flex; min-height: 100vh; background: #F4F8FB; }
    .doctors-page { flex: 1; padding: 24px; }
    .page-hero { display: flex; justify-content: space-between; gap: 24px; align-items: center; padding: 28px; margin-bottom: 24px; color: white; border-radius: 28px; background: linear-gradient(135deg,#0D3349,#1A5276 52%,#1E8449); box-shadow: 0 18px 54px rgba(13,51,73,0.16); }
    .page-hero img { width: 160px; padding: 10px 14px; border-radius: 18px; background: rgba(255,255,255,0.96); }
    .hero-kicker { margin: 0 0 6px; color: #8EF2B3; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .page-hero h1 { margin: 0 0 8px; font-size: clamp(2rem,4vw,3.5rem); font-weight: 900; }
    .page-hero p:last-child { margin: 0; color: rgba(255,255,255,0.82); }
    .filters-card, .doctor-card, .empty-state { border-radius: 22px !important; box-shadow: 0 14px 44px rgba(13,51,73,0.08) !important; }
    .filters-card { padding: 20px; margin-bottom: 18px; }
    .filters-grid { display: grid; grid-template-columns: repeat(5,minmax(150px,1fr)) auto; gap: 14px; align-items: center; }
    .filters-grid mat-form-field { width: 100%; }
    .results-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; color: #6D7D88; }
    .results-toolbar p { margin: 0; }
    .results-toolbar strong { color: #173B52; }
    .loading-state { display: grid; place-items: center; gap: 12px; padding: 60px; color: #7F8C8D; }
    .doctors-results { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 20px; }
    .doctors-results--list { grid-template-columns: 1fr; }
    .doctor-card { padding: 22px; display: flex; flex-direction: column; gap: 18px; }
    .doctor-card--list { flex-direction: row; align-items: center; justify-content: space-between; }
    .doctor-card__main { display: flex; gap: 16px; min-width: 0; }
    .doctor-avatar { width: 72px; height: 72px; flex: 0 0 auto; display: grid; place-items: center; overflow: hidden; border-radius: 22px; color: white; font-size: 24px; font-weight: 900; box-shadow: 0 14px 34px rgba(13,51,73,0.16); }
    .doctor-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .doctor-info { min-width: 0; flex: 1; }
    .doctor-title-row { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
    .doctor-info h2 { margin: 0 0 6px; color: #173B52; font-size: 19px; font-weight: 900; }
    .specialty-badge, .availability-badge { display: inline-flex; align-items: center; width: fit-content; border-radius: 999px; padding: 4px 11px; font-size: 11px; font-weight: 800; }
    .specialty-badge { color: #1A5276; background: #D6EAF8; }
    .availability-badge { flex: 0 0 auto; color: #1E8449; background: #D5F5E3; }
    .doctor-bio { display: -webkit-box; min-height: 42px; margin: 0 0 12px; overflow: hidden; color: #6D7D88; font-size: 13px; line-height: 1.6; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .doctor-meta { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-bottom: 12px; color: #6D7D88; font-size: 13px; }
    .doctor-meta span { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .doctor-meta mat-icon { color: #1A5276; font-size: 17px; width: 17px; height: 17px; }
    .rating-row { display: flex; align-items: center; gap: 3px; color: #F5B041; }
    .rating-row mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .rating-row strong { margin-left: 6px; color: #173B52; }
    .doctor-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    .empty-state { padding: 44px; text-align: center; color: #6D7D88; }
    .empty-state mat-icon { font-size: 46px; width: 46px; height: 46px; color: #95A5A6; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 24px; }
    .pagination .active { color: white; background: #1A5276; }
    @media (max-width: 1180px) { .filters-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .doctor-card--list { flex-direction: column; align-items: stretch; } }
    @media (max-width: 720px) { .doctors-page { padding: 16px; } .page-hero { align-items: flex-start; flex-direction: column; } .page-hero img { width: 140px; } .filters-grid, .doctor-meta { grid-template-columns: 1fr; } .doctor-card__main, .doctor-title-row { flex-direction: column; } .doctor-actions button { width: 100%; } }
  `]
})
export class DoctorSearchComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly api = inject(ApiService);

  loading = true;
  allDoctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  searchText = '';
  filterSpec = '';
  filterVille = '';
  availabilityFilter: AvailabilityFilter = 'any';
  sortBy: SortOption = 'rating';
  viewMode: ViewMode = 'grid';

  currentPage = 0;
  pageSize = 9;

  readonly specialites = ['Généraliste', 'Cardiologue', 'Pédiatre', 'Dermatologue', 'Gynécologue', 'Ophtalmologue', 'Chirurgien', 'Neurologue', 'Psychiatre', 'Urgentiste'];
  readonly villes = ['Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Bamenda', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi'];

  get totalPages(): number { return Math.ceil(this.filteredDoctors.length / this.pageSize); }
  get pagedDoctors(): Doctor[] { return this.filteredDoctors.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }

  ngOnInit(): void {
    this.search();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  search(): void {
    this.loading = true;
    this.currentPage = 0;
    const params: Record<string, string> = {};
    if (this.filterSpec) params['specialite'] = this.filterSpec;
    if (this.filterVille) params['ville'] = this.filterVille;

    this.api.get<Doctor[]>('/api/doctors/search', params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allDoctors = data ?? [];
          this.applyLocalFilter();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.allDoctors = [];
          this.filteredDoctors = [];
        }
      });
  }

  applyLocalFilter(): void {
    const q = this.searchText.trim().toLowerCase();
    this.currentPage = 0;
    this.filteredDoctors = this.allDoctors
      .filter((doctor) => this.matchesSearch(doctor, q))
      .filter((doctor) => this.matchesAvailability(doctor))
      .sort((a, b) => this.compareDoctors(a, b));
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
  }

  getConsultationPrice(doctor: Doctor): number {
    return doctor.prixConsultation ?? doctor.tarif ?? 0;
  }

  getRating(doctor: Doctor): number {
    return doctor.note ?? doctor.rating ?? 4.5;
  }

  getStars(doctor: Doctor): string[] {
    const rounded = Math.round(this.getRating(doctor));
    return Array.from({ length: 5 }, (_, i) => i < rounded ? 'star' : 'star_border');
  }

  isAvailableToday(doctor: Doctor): boolean {
    if (doctor.availableToday) return true;
    const today = new Date().toISOString().slice(0, 10);
    return doctor.creneauxDisponibles?.some((slot) => {
      const date = typeof slot === 'string' ? slot : slot.dateHeure ?? slot.start ?? '';
      const available = typeof slot === 'string' ? true : slot.available !== false;
      return available && date.startsWith(today);
    }) ?? false;
  }

  getAvatarColor(specialite: string): string {
    const colors = ['#1A5276', '#27AE60', '#8E44AD', '#E67E22', '#2980B9', '#C0392B'];
    return colors[(specialite ?? '').length % colors.length] ?? '#1A5276';
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private matchesSearch(doctor: Doctor, query: string): boolean {
    if (!query) return true;
    return [doctor.nom, doctor.prenom, doctor.specialite, doctor.ville]
      .some((value) => (value ?? '').toLowerCase().includes(query));
  }

  private matchesAvailability(doctor: Doctor): boolean {
    if (this.availabilityFilter === 'any') return true;
    if (this.availabilityFilter === 'today') return this.isAvailableToday(doctor);
    return this.hasAvailabilityThisWeek(doctor);
  }

  private hasAvailabilityThisWeek(doctor: Doctor): boolean {
    if (this.isAvailableToday(doctor)) return true;
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    return doctor.creneauxDisponibles?.some((slot) => {
      const rawDate = typeof slot === 'string' ? slot : slot.dateHeure ?? slot.start ?? '';
      const date = new Date(rawDate);
      const available = typeof slot === 'string' ? true : slot.available !== false;
      return available && !Number.isNaN(date.getTime()) && date >= now && date <= weekEnd;
    }) ?? false;
  }

  private compareDoctors(a: Doctor, b: Doctor): number {
    if (this.sortBy === 'name') return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
    if (this.sortBy === 'distance') return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
    return this.getRating(b) - this.getRating(a);
  }
}
