// src/app/features/patient/medical-record/medical-record.component.ts
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { MedicalRecordService } from '../../../core/services/medical-record.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule,
            MatCardModule, MatFormFieldModule, MatInputModule,
            MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="display:flex;min-height:100vh;">
      <app-sidebar [role]="'patient'" [activeRoute]="'/patient/medical-record'"></app-sidebar>

      <main class="main-content" style="flex:1;">
        <div class="page-header">
          <h1>Mon dossier médical</h1>
          <button mat-raised-button (click)="editMode = !editMode"
                  [style.background]="editMode ? '#27AE60' : '#1A5276'"
                  style="color:white;border-radius:8px;">
            <mat-icon>{{editMode ? 'save' : 'edit'}}</mat-icon>
            {{editMode ? 'Enregistrer' : 'Modifier'}}
          </button>
        </div>

        <div *ngIf="loading" style="text-align:center;padding:60px;">
          <mat-progress-spinner mode="indeterminate" diameter="48" style="margin:0 auto;"></mat-progress-spinner>
        </div>

        <div *ngIf="!loading"
             style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <mat-card *ngFor="let section of sections; trackBy: trackByItem" style="padding:24px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <mat-icon [style.color]="section.color">{{section.icon}}</mat-icon>
              <h3 style="font-size:15px;font-weight:600;color:#2C3E50;">{{section.label}}</h3>
            </div>
            <textarea *ngIf="editMode" [(ngModel)]="record[section.key]" rows="4"
                      [placeholder]="'Saisir ' + section.label.toLowerCase() + '...'"
                      style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;
                             font-size:13px;resize:vertical;font-family:inherit;outline:none;">
            </textarea>
            <p *ngIf="!editMode"
               style="font-size:13px;color:#2C3E50;line-height:1.6;white-space:pre-wrap;">
              {{record[section.key] || '—'}}
            </p>
          </mat-card>
        </div>

        <div *ngIf="editMode" style="margin-top:16px;">
          <button mat-raised-button (click)="save()" [disabled]="saving"
                  style="background:#27AE60;color:white;border-radius:8px;padding:10px 32px;">
            <span *ngIf="!saving">💾 Enregistrer les modifications</span>
            <span *ngIf="saving">Enregistrement...</span>
          </button>
        </div>
      </main>
    </div>
  `
})
export class MedicalRecordComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  auth     = inject(AuthService);
  private medicalRecordService = inject(MedicalRecordService);
  private notification = inject(NotificationService);

  loading  = true;
  saving   = false;
  editMode = false;
  record: Record<string, string> = {
    antecedentsFamiliaux: '', traitementEnCours: '', vaccinations: ''
  };

  sections = [
    { key:'antecedentsFamiliaux', label:'Antécédents familiaux', icon:'family_restroom',  color:'#E67E22' },
    { key:'traitementEnCours',    label:'Traitements en cours',  icon:'medication',        color:'#2980B9' },
    { key:'vaccinations',         label:'Vaccinations',          icon:'vaccines',          color:'#27AE60' },
  ];

  ngOnInit(): void {
    this.medicalRecordService.getRecord().pipe(takeUntil(this.destroy$)).subscribe({
      next: (d) => {
        this.record['antecedentsFamiliaux'] = d.antecedentsFamiliaux ?? '';
        this.record['traitementEnCours']    = d.traitementEnCours ?? '';
        this.record['vaccinations']         = d.vaccinations ?? '';
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    this.saving = true;
    this.medicalRecordService.updateRecord(this.record).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.editMode = false;
        this.notification.success('Dossier médical mis à jour ✅', 3000);
      },
      error: () => { this.saving = false; }
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
