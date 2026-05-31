// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

export interface NavLink {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <aside class="sidebar" [style.background]="bgColor">

      <!-- Logo -->
      <div class="sidebar-logo">
        <span class="logo-icon">{{logoEmoji}}</span> SteevaCare
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <a *ngFor="let link of navLinks"
           class="nav-item"
           [routerLink]="link.route"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: link.route.endsWith('dashboard') }">
          <mat-icon>{{link.icon}}</mat-icon>
          {{link.label}}
        </a>
      </nav>

      <!-- Déconnexion -->
      <div class="sidebar-footer">
        <a class="nav-item" (click)="auth.logout()" style="cursor:pointer;">
          <mat-icon>logout</mat-icon> Déconnexion
        </a>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  /** Rôle : 'admin' | 'doctor' | 'patient' | 'pharmacy' */
  @Input() role: 'admin' | 'doctor' | 'patient' | 'pharmacy' = 'patient';

  auth = inject(AuthService);

  get bgColor(): string {
    const colors: Record<string, string> = {
      admin:    '#1A5276',
      doctor:   '#0B5345',
      patient:  '#1A5276',
      pharmacy: '#6C3483',
    };
    return colors[this.role] ?? '#1A5276';
  }

  get logoEmoji(): string {
    return this.role === 'doctor' ? '🩺' : '💊';
  }

  get navLinks(): NavLink[] {
    const links: Record<string, NavLink[]> = {
      patient: [
        { icon: 'home',          label: 'Accueil',           route: '/patient/dashboard' },
        { icon: 'search',        label: 'Trouver un médecin', route: '/patient/doctors' },
        { icon: 'event',         label: 'Mes rendez-vous',    route: '/patient/appointments' },
        { icon: 'folder_shared', label: 'Dossier médical',    route: '/patient/medical-record' },
        { icon: 'chat',          label: 'Messagerie',         route: '/patient/messages' },
      ],
      doctor: [
        { icon: 'dashboard',      label: 'Tableau de bord', route: '/doctor/dashboard' },
        { icon: 'calendar_today', label: 'Rendez-vous',     route: '/doctor/appointments' },
        { icon: 'chat',           label: 'Messagerie',       route: '/doctor/messages' },
      ],
      admin: [
        { icon: 'dashboard',          label: 'Tableau de bord', route: '/admin/dashboard' },
        { icon: 'people',             label: 'Utilisateurs',     route: '/admin/users' },
        { icon: 'person_add',         label: 'Créer un compte',  route: '/admin/create-user' },
      ],
      pharmacy: [
        { icon: 'dashboard',  label: 'Tableau de bord', route: '/pharmacy/dashboard' },
        { icon: 'description', label: 'Ordonnances',    route: '/pharmacy/prescriptions' },
      ],
    };
    return links[this.role] ?? [];
  }
}
