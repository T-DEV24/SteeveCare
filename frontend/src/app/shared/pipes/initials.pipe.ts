// src/app/shared/pipes/initials.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials',
  standalone: true
})
export class InitialsPipe implements PipeTransform {
  transform(nom?: string | null, prenom?: string | null): string {
    const firstNameInitial = prenom?.trim()?.[0] ?? '';
    const lastNameInitial = nom?.trim()?.[0] ?? '';
    return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
  }
}
