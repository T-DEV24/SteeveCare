// src/app/core/services/notification.service.ts
import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(message: string, duration = 3000, config: MatSnackBarConfig = {}): MatSnackBarRef<TextOnlySnackBar> {
    return this.open(message, 'success', duration, config);
  }

  error(message: string, duration = 4000, config: MatSnackBarConfig = {}): MatSnackBarRef<TextOnlySnackBar> {
    return this.open(message, 'error', duration, config);
  }

  warning(message: string, duration = 4000, config: MatSnackBarConfig = {}): MatSnackBarRef<TextOnlySnackBar> {
    return this.open(message, 'warning', duration, config);
  }

  info(message: string, duration = 3000, config: MatSnackBarConfig = {}): MatSnackBarRef<TextOnlySnackBar> {
    return this.open(message, 'info', duration, config);
  }

  private open(
    message: string,
    type: NotificationType,
    duration: number,
    config: MatSnackBarConfig
  ): MatSnackBarRef<TextOnlySnackBar> {
    const panelClass = [
      `snack-${type}`,
      ...(Array.isArray(config.panelClass) ? config.panelClass : config.panelClass ? [config.panelClass] : [])
    ];

    return this.snackBar.open(message, '✕', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      ...config,
      panelClass
    });
  }
}
