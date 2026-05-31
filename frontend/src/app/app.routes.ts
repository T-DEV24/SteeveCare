// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Racine
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ── Public ────────────────────────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // ── PATIENT ────────────────────────────────────────────────────────────────
  {
    path: 'patient/dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    loadComponent: () =>
      import('./features/patient/dashboard/dashboard.component')
        .then(m => m.PatientDashboardComponent)
  },
  {
    path: 'patient/doctors',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    loadComponent: () =>
      import('./features/patient/doctors/doctors.component')
        .then(m => m.DoctorSearchComponent)
  },
  {
    path: 'patient/appointments',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    loadComponent: () =>
      import('./features/patient/appointments/appointments.component')
        .then(m => m.MyAppointmentsComponent)
  },
  {
    path: 'patient/medical-record',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    loadComponent: () =>
      import('./features/patient/medical-record/medical-record.component')
        .then(m => m.MedicalRecordComponent)
  },
  {
    path: 'patient/messages',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    loadComponent: () =>
      import('./features/patient/messages/messages.component')
        .then(m => m.MessagesComponent)
  },

  // ── DOCTOR ─────────────────────────────────────────────────────────────────
  {
    path: 'doctor/dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] },
    loadComponent: () =>
      import('./features/doctor/dashboard/dashboard.component')
        .then(m => m.DoctorDashboardComponent)
  },
  {
    path: 'doctor/appointments',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] },
    loadComponent: () =>
      import('./features/doctor/appointments/appointments.component')
        .then(m => m.DoctorAppointmentsComponent)
  },
  {
    path: 'doctor/consultation/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] },
    loadComponent: () =>
      import('./features/doctor/consultation/consultation.component')
        .then(m => m.ConsultationComponent)
  },
  {
    path: 'doctor/messages',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] },
    loadComponent: () =>
      import('./features/doctor/messages/messages.component')
        .then(m => m.DoctorMessagesComponent)
  },

  // ── PHARMACY ───────────────────────────────────────────────────────────────
  {
    path: 'pharmacy/dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PHARMACY'] },
    loadComponent: () =>
      import('./features/pharmacy/dashboard/dashboard.component')
        .then(m => m.PharmacyDashboardComponent)
  },
  {
    path: 'pharmacy/prescriptions',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PHARMACY'] },
    loadComponent: () =>
      import('./features/pharmacy/prescriptions/prescriptions.component')
        .then(m => m.PrescriptionsComponent)
  },

  // ── ADMIN / GESTIONNAIRE / SUPER_ADMIN ─────────────────────────────────────
  {
    path: 'admin/dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'GESTIONNAIRE', 'SUPER_ADMIN'] },
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard.component')
        .then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'GESTIONNAIRE', 'SUPER_ADMIN'] },
    loadComponent: () =>
      import('./features/admin/users/users.component')
        .then(m => m.UserManagementComponent)
  },
  {
    path: 'admin/create-user',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'GESTIONNAIRE', 'SUPER_ADMIN'] },
    loadComponent: () =>
      import('./features/admin/create-user/create-user.component')
        .then(m => m.CreateUserComponent)
  },

  // ── Redirection wildcard (toujours en dernier) ─────────────────────────────
  { path: '**', redirectTo: '/' }
];
