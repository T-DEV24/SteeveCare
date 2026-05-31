// src/app/shared/pipes/date-fr.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

export type DateFrFormat = 'short' | 'medium' | 'long' | 'dateOnly';

@Pipe({
  name: 'dateFr',
  standalone: true
})
export class DateFrPipe implements PipeTransform {
  transform(value?: string | Date | null, format: DateFrFormat = 'medium'): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const formats: Record<DateFrFormat, Intl.DateTimeFormatOptions> = {
      short: { day: '2-digit', month: 'short' },
      medium: { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
      long: { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' },
      dateOnly: { weekday: 'short', day: 'numeric', month: 'short' }
    };

    return new Intl.DateTimeFormat('fr-FR', formats[format]).format(date).replace(':', 'h');
  }
}
