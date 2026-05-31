// src/app/core/services/medical-record.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface MedicalRecord {
  antecedentsFamiliaux?: string;
  traitementEnCours?: string;
  vaccinations?: string;
  [key: string]: string | undefined;
}

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  private api = inject(ApiService);
  private recordCache$?: Observable<MedicalRecord>;

  getRecord(): Observable<MedicalRecord> {
    if (!this.recordCache$) {
      this.recordCache$ = this.api
        .get<MedicalRecord>('/api/patients/me/medical-record')
        .pipe(shareReplay(1));
    }

    return this.recordCache$;
  }

  updateRecord(record: MedicalRecord): Observable<MedicalRecord> {
    return this.api
      .patch<MedicalRecord>('/api/patients/me/medical-record', record)
      .pipe(
        tap((updated) => {
          this.recordCache$ = of(updated ?? record).pipe(
            shareReplay(1)
          );
        })
      );
  }

  clearCache(): void {
    this.recordCache$ = undefined;
  }
}
