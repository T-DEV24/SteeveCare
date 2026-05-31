// src/app/features/patient/doctor-detail/doctor-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { InitialsPipe } from '../../../shared/pipes/initials.pipe';

interface DoctorDetail {
  id: number;
  userId: number;
  nom: string;
  prenom: string;
  specialite: string;
  biographie?: string;
  ville?: string;
  tarif?: number;
  prixConsultation?: number;
  anneesExperience?: number;
  photoUrl?: string;
  note?: number;
  rating?: number;
  diplome?: string;
  langues?: string[];
}

interface AvailabilitySlot {
  id?: number;
  dateHeure: string;
  end?: string;
  available?: boolean;
}

interface DayAvailability {
  date: Date;
  slots: AvailabilitySlot[];
}

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InitialsPipe,
    DateFrPipe,
    SidebarComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="detail-layout">
      <app-sidebar [role]="'patient'" [activeRoute]="'/patient/doctors'"></app-sidebar>

      <main class="main-content detail-page">
        <div *ngIf="loading" class="loading-state">
          <mat-progress-spinner diameter="52" mode="indeterminate"></mat-progress-spinner>
          <p>Chargement du profil médecin...</p>
        </div>

        <ng-container *ngIf="!loading && doctor">
          <button mat-stroked-button color="primary" routerLink="/patient/doctors" class="back-button">
            <mat-icon>arrow_back</mat-icon>
            Retour aux médecins
          </button>

          <section class="doctor-hero">
            <div class="doctor-avatar" [style.background]="getAvatarColor(doctor.specialite)">
              <img *ngIf="doctor.photoUrl" [src]="doctor.photoUrl" [alt]="'Photo Dr ' + doctor.prenom + ' ' + doctor.nom">
              <span *ngIf="!doctor.photoUrl">{{doctor.nom | initials:doctor.prenom}}</span>
            </div>

            <div class="doctor-hero__content">
              <p class="hero-kicker">Profil médecin</p>
              <h1>Dr. {{doctor.prenom}} {{doctor.nom}}</h1>
              <span class="specialty-badge">{{doctor.specialite}}</span>
              <p class="bio">{{doctor.biographie || 'Médecin partenaire SteevaCare, disponible pour une prise en charge personnalisée.'}}</p>

              <div class="doctor-meta">
                <span><mat-icon>location_on</mat-icon>{{doctor.ville || 'Ville non renseignée'}}</span>
                <span><mat-icon>payments</mat-icon>{{consultationPrice | number}} FCFA</span>
                <span><mat-icon>workspace_premium</mat-icon>{{doctor.anneesExperience || 1}} ans d'expérience</span>
                <span class="stars"><mat-icon *ngFor="let star of stars; trackBy: trackByValue">{{star}}</mat-icon>{{rating | number:'1.1-1'}}</span>
              </div>
            </div>
          </section>

          <section class="detail-grid" *ngIf="!confirmedAppointment">
            <mat-card class="availability-card">
              <div class="section-title">
                <mat-icon>calendar_month</mat-icon>
                <div>
                  <h2>Disponibilités</h2>
                  <p>Sélectionnez un créneau parmi les 7 prochains jours.</p>
                </div>
              </div>

              <div class="calendar-grid">
                <article *ngFor="let day of weekAvailability; trackBy: trackByDay" class="day-card">
                  <h3>{{day.date | date:'EEE d MMM':'':'fr'}}</h3>
                  <div class="slots">
                    <button
                      *ngFor="let slot of day.slots; trackBy: trackBySlot"
                      mat-stroked-button
                      type="button"
                      [disabled]="slot.available === false"
                      [class.selected]="selectedSlot?.dateHeure === slot.dateHeure"
                      (click)="selectSlot(slot)">
                      {{slot.dateHeure | date:'HH:mm'}}
                    </button>
                    <span *ngIf="day.slots.length === 0" class="no-slot">Aucun créneau</span>
                  </div>
                </article>
              </div>
            </mat-card>

            <mat-card class="booking-card">
              <div class="section-title">
                <mat-icon>event_available</mat-icon>
                <div>
                  <h2>Prendre rendez-vous</h2>
                  <p>Confirmez le motif et le créneau choisi.</p>
                </div>
              </div>

              <form [formGroup]="appointmentForm" (ngSubmit)="confirmAppointment()">
                <mat-form-field appearance="outline">
                  <mat-label>Motif</mat-label>
                  <mat-select formControlName="motif">
                    <mat-option *ngFor="let motif of appointmentReasons; trackBy: trackByValue" [value]="motif">
                      {{motif}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Notes complémentaires</mat-label>
                  <textarea matInput rows="5" formControlName="notes" placeholder="Décrivez brièvement votre besoin..."></textarea>
                </mat-form-field>

                <div class="selected-slot-box" [class.empty]="!selectedSlot">
                  <mat-icon>{{selectedSlot ? 'check_circle' : 'schedule'}}</mat-icon>
                  <div>
                    <strong>Créneau sélectionné</strong>
                    <p>{{selectedSlot ? (selectedSlot.dateHeure | dateFr) : 'Choisissez un créneau dans le calendrier.'}}</p>
                  </div>
                </div>

                <button mat-raised-button color="primary" type="submit" [disabled]="appointmentForm.invalid || !selectedSlot || bookingLoading">
                  <mat-progress-spinner *ngIf="bookingLoading" diameter="18" mode="indeterminate"></mat-progress-spinner>
                  <mat-icon *ngIf="!bookingLoading">event_available</mat-icon>
                  Confirmer le RDV
                </button>
              </form>
            </mat-card>
          </section>

          <mat-card *ngIf="confirmedAppointment" class="confirmation-card">
            <svg class="checkmark" viewBox="0 0 52 52" aria-hidden="true">
              <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark__check" fill="none" d="M14 27l7 7 17-17"/>
            </svg>

            <h2>Rendez-vous confirmé !</h2>
            <p>Votre rendez-vous avec Dr. {{doctor.prenom}} {{doctor.nom}} a bien été enregistré.</p>

            <div class="recap-card">
              <div><strong>Médecin</strong><span>Dr. {{doctor.prenom}} {{doctor.nom}}</span></div>
              <div><strong>Spécialité</strong><span>{{doctor.specialite}}</span></div>
              <div><strong>Date</strong><span>{{confirmedAppointment.dateHeure | dateFr}}</span></div>
              <div><strong>Motif</strong><span>{{confirmedAppointment.motif}}</span></div>
            </div>

            <div class="confirmation-actions">
              <a mat-raised-button color="primary" [href]="calendarLink" download="steevacare-rendez-vous.ics">
                <mat-icon>calendar_month</mat-icon>
                Ajouter au calendrier
              </a>
              <button mat-stroked-button routerLink="/patient/appointments">
                <mat-icon>event_note</mat-icon>
                Voir mes rendez-vous
              </button>
            </div>
          </mat-card>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .detail-layout { display: flex; min-height: 100vh; background: #F4F8FB; }
    .detail-page { flex: 1; padding: 24px; }
    .loading-state { display: grid; place-items: center; gap: 12px; padding: 80px; color: #7F8C8D; }
    .back-button { margin-bottom: 18px; }
    .doctor-hero { display: flex; gap: 24px; align-items: center; padding: 30px; margin-bottom: 24px; color: white; border-radius: 30px; background: linear-gradient(135deg,#0D3349,#1A5276 52%,#1E8449); box-shadow: 0 18px 54px rgba(13,51,73,0.16); }
    .doctor-avatar { width: 132px; height: 132px; display: grid; place-items: center; flex: 0 0 auto; overflow: hidden; border-radius: 34px; color: white; font-size: 42px; font-weight: 900; box-shadow: 0 18px 44px rgba(0,0,0,0.22); }
    .doctor-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .hero-kicker { margin: 0 0 8px; color: #8EF2B3; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .doctor-hero h1 { margin: 0 0 10px; font-size: clamp(2rem,4vw,3.5rem); font-weight: 900; }
    .specialty-badge { display: inline-flex; width: fit-content; padding: 5px 13px; border-radius: 999px; color: #1A5276; background: white; font-size: 12px; font-weight: 900; }
    .bio { max-width: 760px; margin: 16px 0; color: rgba(255,255,255,0.84); line-height: 1.7; }
    .doctor-meta { display: flex; flex-wrap: wrap; gap: 14px; }
    .doctor-meta span { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.9); }
    .doctor-meta mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .stars mat-icon { color: #F5B041; }
    .detail-grid { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(320px,0.8fr); gap: 24px; align-items: start; }
    .availability-card, .booking-card, .confirmation-card { border-radius: 24px !important; padding: 24px; box-shadow: 0 14px 44px rgba(13,51,73,0.08) !important; }
    .section-title { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 20px; }
    .section-title mat-icon { color: #1A5276; }
    .section-title h2 { margin: 0 0 4px; color: #173B52; font-weight: 900; }
    .section-title p { margin: 0; color: #7F8C8D; line-height: 1.5; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7,minmax(120px,1fr)); gap: 12px; overflow-x: auto; padding-bottom: 4px; }
    .day-card { min-width: 120px; padding: 14px; border: 1px solid #E7EDF2; border-radius: 18px; background: #F8FBFD; }
    .day-card h3 { margin: 0 0 12px; color: #173B52; font-size: 14px; text-transform: capitalize; }
    .slots { display: flex; flex-direction: column; gap: 8px; }
    .slots button { border-radius: 999px; }
    .slots button.selected { color: white; background: #1A5276; }
    .no-slot { color: #95A5A6; font-size: 12px; }
    form { display: flex; flex-direction: column; gap: 16px; }
    mat-form-field { width: 100%; }
    .selected-slot-box { display: flex; gap: 12px; align-items: flex-start; padding: 14px; border-radius: 16px; color: #1E8449; background: #EAF8F0; border: 1px solid rgba(39,174,96,0.18); }
    .selected-slot-box.empty { color: #7F8C8D; background: #F5F6FA; border-color: #E7EDF2; }
    .selected-slot-box p { margin: 4px 0 0; }
    button mat-progress-spinner, a mat-icon, button mat-icon { display: inline-block; margin-right: 8px; vertical-align: middle; }
    .confirmation-card { max-width: 760px; margin: 0 auto; text-align: center; }
    .confirmation-card h2 { color: #1E8449; font-size: 30px; margin: 18px 0 8px; }
    .confirmation-card > p { color: #6D7D88; }
    .checkmark { width: 92px; height: 92px; border-radius: 50%; display: block; stroke-width: 3; stroke: #27AE60; stroke-miterlimit: 10; margin: 0 auto; box-shadow: inset 0 0 0 #27AE60; animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both; }
    .checkmark__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 3; stroke-miterlimit: 10; stroke: #27AE60; fill: none; animation: stroke .6s cubic-bezier(.65,0,.45,1) forwards; }
    .checkmark__check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; animation: stroke .3s cubic-bezier(.65,0,.45,1) .8s forwards; }
    .recap-card { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin: 24px 0; text-align: left; }
    .recap-card div { padding: 14px; border-radius: 14px; background: #F8FBFD; }
    .recap-card strong { display: block; color: #7F8C8D; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .recap-card span { color: #173B52; font-weight: 800; }
    .confirmation-actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
    @keyframes stroke { 100% { stroke-dashoffset: 0; } }
    @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1,1.1,1); } }
    @keyframes fill { 100% { box-shadow: inset 0 0 0 46px rgba(39,174,96,0.08); } }
    @media (max-width: 1100px) { .detail-grid { grid-template-columns: 1fr; } .calendar-grid { grid-template-columns: repeat(7,140px); } }
    @media (max-width: 720px) { .detail-page { padding: 16px; } .doctor-hero { align-items: flex-start; flex-direction: column; } .doctor-avatar { width: 104px; height: 104px; font-size: 34px; } .recap-card { grid-template-columns: 1fr; } .confirmation-actions a, .confirmation-actions button { width: 100%; } }
  `]
})
export class DoctorDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = true;
  bookingLoading = false;
  doctor: DoctorDetail | null = null;
  weekAvailability: DayAvailability[] = [];
  selectedSlot: AvailabilitySlot | null = null;
  confirmedAppointment: { dateHeure: string; motif: string; notes?: string } | null = null;
  calendarLink = '#';

  readonly appointmentReasons = ['Consultation générale', 'Contrôle médical', 'Suivi de traitement', 'Avis spécialisé', 'Urgence non vitale'];

  readonly appointmentForm = this.fb.group({
    motif: ['', Validators.required],
    notes: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    const doctorId = this.route.snapshot.paramMap.get('id');
    if (!doctorId) {
      this.router.navigate(['/patient/doctors']);
      return;
    }

    this.loadDoctor(+doctorId);
    this.loadAvailability(+doctorId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get consultationPrice(): number {
    return this.doctor?.prixConsultation ?? this.doctor?.tarif ?? 0;
  }

  get rating(): number {
    return this.doctor?.note ?? this.doctor?.rating ?? 4.5;
  }

  get stars(): string[] {
    const rounded = Math.round(this.rating);
    return Array.from({ length: 5 }, (_, i) => i < rounded ? 'star' : 'star_border');
  }

  selectSlot(slot: AvailabilitySlot): void {
    if (slot.available === false) return;
    this.selectedSlot = slot;
  }

  confirmAppointment(): void {
    if (!this.doctor || !this.selectedSlot || this.appointmentForm.invalid || this.bookingLoading) return;

    const value = this.appointmentForm.getRawValue();
    const body = {
      patientId: this.auth.userId,
      doctorId: this.doctor.userId ?? this.doctor.id,
      dateHeure: new Date(this.selectedSlot.dateHeure).toISOString(),
      type: 'VIDEO',
      motif: value.motif,
      notes: value.notes,
      availabilitySlotId: this.selectedSlot.id
    };

    this.bookingLoading = true;
    this.api.post('/api/appointments', body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.bookingLoading = false;
          this.confirmedAppointment = {
            dateHeure: body.dateHeure,
            motif: value.motif ?? '',
            notes: value.notes ?? ''
          };
          this.calendarLink = this.buildCalendarLink(this.confirmedAppointment);
          this.notification.success('Rendez-vous confirmé !', 4000);
        },
        error: (err) => {
          this.bookingLoading = false;
          this.notification.error(err.error?.erreur ?? err.error?.message ?? 'Erreur lors de la prise de RDV', 5000);
        }
      });
  }

  getAvatarColor(specialite: string): string {
    const colors = ['#1A5276', '#27AE60', '#8E44AD', '#E67E22', '#2980B9', '#C0392B'];
    return colors[(specialite ?? '').length % colors.length] ?? '#1A5276';
  }

  trackByDay(_: number, day: DayAvailability): string {
    return day.date.toISOString();
  }

  trackBySlot(_: number, slot: AvailabilitySlot): string {
    return slot.id?.toString() ?? slot.dateHeure;
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  private loadDoctor(id: number): void {
    this.api.get<DoctorDetail>(`/api/doctors/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (doctor) => {
          this.doctor = doctor;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.notification.error('Médecin introuvable.', 4000);
          this.router.navigate(['/patient/doctors']);
        }
      });
  }

  private loadAvailability(id: number): void {
    this.weekAvailability = this.buildFallbackAvailability();

    this.api.get<AvailabilitySlot[]>(`/api/doctors/${id}/availability`, { days: 7 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slots) => {
          if (slots?.length) this.weekAvailability = this.groupSlotsByDay(slots);
        }
      });
  }

  private buildFallbackAvailability(): DayAvailability[] {
    const times = [9, 10, 11, 14, 15, 16];
    return Array.from({ length: 7 }, (_, dayOffset) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + dayOffset);
      return {
        date,
        slots: times.map((hour) => {
          const slot = new Date(date);
          slot.setHours(hour, 0, 0, 0);
          return { dateHeure: slot.toISOString(), available: slot > new Date() };
        })
      };
    });
  }

  private groupSlotsByDay(slots: AvailabilitySlot[]): DayAvailability[] {
    const days = this.buildFallbackAvailability().map(day => ({ ...day, slots: [] as AvailabilitySlot[] }));
    slots.forEach((slot) => {
      const date = new Date(slot.dateHeure);
      const key = date.toISOString().slice(0, 10);
      const day = days.find(item => item.date.toISOString().slice(0, 10) === key);
      if (day) day.slots.push(slot);
    });
    return days;
  }

  private buildCalendarLink(appointment: { dateHeure: string; motif: string; notes?: string }): string {
    const start = new Date(appointment.dateHeure);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const format = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const summary = `RDV SteevaCare - Dr ${this.doctor?.prenom ?? ''} ${this.doctor?.nom ?? ''}`.trim();
    const description = `${appointment.motif}${appointment.notes ? ` - ${appointment.notes}` : ''}`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SteevaCare//Appointments//FR',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@steevacare`,
      `DTSTAMP:${format(new Date())}`,
      `DTSTART:${format(start)}`,
      `DTEND:${format(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }
}
