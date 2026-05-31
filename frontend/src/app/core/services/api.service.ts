// src/app/core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly REQUEST_TIMEOUT_MS = 10000;
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
    return this.http
      .get<T>(this.buildUrl(path), { params: httpParams })
      .pipe(timeout(this.REQUEST_TIMEOUT_MS));
  }

  /** POST */
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(this.buildUrl(path), body)
      .pipe(timeout(this.REQUEST_TIMEOUT_MS));
  }

  /** PATCH */
  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .patch<T>(this.buildUrl(path), body ?? {})
      .pipe(timeout(this.REQUEST_TIMEOUT_MS));
  }

  /** PUT */
  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(this.buildUrl(path), body)
      .pipe(timeout(this.REQUEST_TIMEOUT_MS));
  }

  /** DELETE */
  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(this.buildUrl(path))
      .pipe(timeout(this.REQUEST_TIMEOUT_MS));
  }

  private buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;

    const baseUrl = environment.apiUrl.replace(/\/+$/, '');
    const normalizedPath = path
      .replace(/^\/+/, '')
      .replace(/^api\/?/, '');

    return `${baseUrl}/${normalizedPath}`;
  }
}
