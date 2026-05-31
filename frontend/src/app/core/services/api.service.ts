// src/app/core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = 'http://localhost:8082';
  private readonly http = inject(HttpClient);

  /** GET avec paramètres optionnels */
  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          httpParams = httpParams.set(key, String(val));
        }
      });
    }
    return this.http.get<T>(`${this.BASE_URL}${path}`, { params: httpParams });
  }

  /** POST */
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.BASE_URL}${path}`, body);
  }

  /** PATCH */
  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(`${this.BASE_URL}${path}`, body ?? {});
  }

  /** PUT */
  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.BASE_URL}${path}`, body);
  }

  /** DELETE */
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.BASE_URL}${path}`);
  }
}
