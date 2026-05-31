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
    <button mat-icon-button
            type="button"
            class="sidebar-toggle"
            [attr.aria-label]="mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
            [attr.aria-expanded]="mobileOpen"
            (click)="mobileOpen = !mobileOpen">
      <mat-icon>{{mobileOpen ? 'close' : 'menu'}}</mat-icon>
    </button>
    <aside class="sidebar" [class.mobile-open]="mobileOpen" [style.background]="bgColor">
      <div class="sidebar-logo">
        <img src="assets/brand/steevacare-logo.svg" alt="SteevaCare - Télémédecine pour l'Afrique">
      </div>

      <nav class="sidebar-nav">
        <a *ngFor="let link of navLinks; trackBy: trackByItem"
           class="nav-item"
           [class.active]="link.route === activeRoute"
           [routerLink]="link.route"
           (click)="mobileOpen = false"
           style="position:relative;">
          <mat-icon>{{link.icon}}</mat-icon>
          {{link.label}}
          <span *ngIf="badgeCounts[link.route] > 0"
                class="sidebar-badge-pulse"
                style="position:absolute;right:14px;top:50%;transform:translateY(-50%);
                       background:#E74C3C;color:white;border-radius:999px;min-width:20px;
                       height:20px;padding:0 6px;font-size:11px;font-weight:700;
                       display:flex;align-items:center;justify-content:center;">
            {{badgeCounts[link.route]}}
          </span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <button mat-button type="button" class="nav-item" (click)="auth.logout()">
          <mat-icon>logout</mat-icon> Déconnexion
        </button>
      </div>
    </aside>
  `,
  styles: [`
    @keyframes sidebarBadgePulse {
      0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.65); }
      70% { box-shadow: 0 0 0 8px rgba(231, 76, 60, 0); }
      100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
    }

    .sidebar-badge-pulse {
      animation: sidebarBadgePulse 1.4s infinite;
    }

    .sidebar-logo img {
      display: block;
      width: 156px;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      padding: 10px 12px;
      border-radius: 16px;
      background: rgba(255,255,255,0.96);
      box-shadow: 0 12px 28px rgba(0,0,0,0.18);
    }
  `]
})
export class SidebarComponent {
  mobileOpen = false;

  @Input() role: SidebarRole = 'patient';
  @Input() activeRoute = '';
  @Input() badgeCounts: Record<string, number> = {};

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


  get navLinks(): NavLink[] {
    const links: Record<SidebarRole, NavLink[]> = {
      admin: [
        { icon: 'dashboard', label: 'Tableau de bord', route: '/admin/dashboard' },
        { icon: 'people', label: 'Utilisateurs', route: '/admin/users' },
        { icon: 'person_add', label: 'Créer un compte', route: '/admin/create-user' },
        { icon: 'account_circle', label: 'Mon profil', route: '/profile' },
      ],
      doctor: [
        { icon: 'dashboard', label: 'Tableau de bord', route: '/doctor/dashboard' },
        { icon: 'calendar_today', label: 'Rendez-vous', route: '/doctor/appointments' },
        { icon: 'chat', label: 'Messagerie', route: '/doctor/messages' },
        { icon: 'account_circle', label: 'Mon profil', route: '/profile' },
      ],
      patient: [
        { icon: 'home', label: 'Accueil', route: '/patient/dashboard' },
        { icon: 'search', label: 'Trouver un médecin', route: '/patient/doctors' },
        { icon: 'event', label: 'Mes rendez-vous', route: '/patient/appointments' },
        { icon: 'folder_shared', label: 'Dossier médical', route: '/patient/medical-record' },
        { icon: 'chat', label: 'Messagerie', route: '/patient/messages' },
        { icon: 'account_circle', label: 'Mon profil', route: '/profile' },
      ],
      pharmacy: [
        { icon: 'dashboard', label: 'Tableau de bord', route: '/pharmacy/dashboard' },
        { icon: 'description', label: 'Ordonnances', route: '/pharmacy/prescriptions' },
        { icon: 'account_circle', label: 'Mon profil', route: '/profile' },
      ],
    };
    return links[this.role];
  }

  trackByItem(_: number, item: any): unknown {
    return item?.id ?? item?.route ?? item?.value ?? item?.label ?? item;
  }

}
