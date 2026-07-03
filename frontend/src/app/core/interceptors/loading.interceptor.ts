// src/app/core/interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

// Ces endpoints sont des appels silencieux — ne pas afficher le spinner
const SILENT_URLS = [
  '/messages/unread-count',
  '/messages/typing',
  '/api/messages/typing',
  '/api/messages/unread-count'
];

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  const isSilent = SILENT_URLS.some(url => req.url.includes(url));
  if (isSilent) return next(req);

  loadingService.show();
  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
