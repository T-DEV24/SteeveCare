// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

export type SidebarRole = 'admin' | 'doctor' | 'patient' | 'pharmacy';

export interface NavLink {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <aside class="sidebar" [style.background]="bgColor">
      <div class="sidebar-logo">
        <span class="logo-icon">{{logoEmoji}}</span> SteevaCare
      </div>

      <nav class="sidebar-nav">
        <a *ngFor="let link of navLinks"
           class="nav-item"
           [class.active]="link.route === activeRoute"
           [routerLink]="link.route">
          <mat-icon>{{link.icon}}</mat-icon>
          {{link.label}}
        </a>
      </nav>

      <div class="sidebar-footer">
        <button mat-button type="button" class="nav-item" (click)="auth.logout()">
          <mat-icon>logout</mat-icon> Déconnexion
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() role: SidebarRole = 'patient';
  @Input() activeRoute = '';

  protected auth = inject(AuthService);

  get bgColor(): string {
    const colors: Record<SidebarRole, string> = {
      admin: '#1A5276',
      doctor: '#0B5345',
      patient: '#1A5276',
      pharmacy: '#6C3483',
    };
    return colors[this.role];
  }

  get logoEmoji(): string {
    return this.role === 'doctor' ? '🩺' : '💊';
  }

  get navLinks(): NavLink[] {
    const links: Record<SidebarRole, NavLink[]> = {
      admin: [
        { icon: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
        { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
        { icon: 'person_add', label: 'Créer un compte', route: '/admin/create-user' },
      ],
      doctor: [
        { icon: 'dashboard', label: 'Tableau de bord', route: '/doctor/dashboard' },
        { icon: 'calendar_today', label: 'Rendez-vous', route: '/doctor/appointments' },
        { icon: 'chat', label: 'Messagerie', route: '/doctor/messages' },
      ],
      patient: [
        { icon: 'home', label: 'Accueil', route: '/patient/dashboard' },
        { icon: 'search', label: 'Trouver un médecin', route: '/patient/doctors' },
        { icon: 'event', label: 'Mes rendez-vous', route: '/patient/appointments' },
        { icon: 'folder_shared', label: 'Dossier médical', route: '/patient/medical-record' },
        { icon: 'chat', label: 'Messagerie', route: '/patient/messages' },
      ],
      pharmacy: [
        { icon: 'dashboard', label: 'Tableau de bord', route: '/pharmacy/dashboard' },
        { icon: 'description', label: 'Ordonnances', route: '/pharmacy/prescriptions' },
      ],
    };
    return links[this.role];
  }
}
