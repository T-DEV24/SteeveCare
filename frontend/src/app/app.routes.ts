// src/app/app.routes.ts
import { Route, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const publicRoute = (path: string, loadComponent: NonNullable<Route['loadComponent']>): Route => ({
  path,
  loadComponent
});

const protectedRoute = (
  path: string,
  roles: string[],
  loadComponent: NonNullable<Route['loadComponent']>
): Route => ({
  path,
  canActivate: [authGuard, roleGuard],
  data: { roles },
  loadComponent
});

const patientRoles = ['PATIENT'];
const doctorRoles = ['DOCTOR'];
const pharmacyRoles = ['PHARMACY'];
const adminRoles = ['ADMIN', 'GESTIONNAIRE', 'SUPER_ADMIN'];

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Toutes les pages applicatives sont chargées en lazy loading standalone.
  publicRoute('home', () =>
    import('./features/home/home.component').then(m => m.HomeComponent)
  ),
  publicRoute('auth/login', () =>
    import('./features/auth/login/login.component').then(m => m.LoginComponent)
  ),
  publicRoute('auth/register', () =>
    import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  ),

  protectedRoute('patient/dashboard', patientRoles, () =>
    import('./features/patient/dashboard/dashboard.component').then(m => m.PatientDashboardComponent)
  ),
  protectedRoute('patient/doctors', patientRoles, () =>
    import('./features/patient/doctors/doctors.component').then(m => m.DoctorSearchComponent)
  ),
  protectedRoute('patient/appointments', patientRoles, () =>
    import('./features/patient/appointments/appointments.component').then(m => m.MyAppointmentsComponent)
  ),
  protectedRoute('patient/medical-record', patientRoles, () =>
    import('./features/patient/medical-record/medical-record.component').then(m => m.MedicalRecordComponent)
  ),
  protectedRoute('patient/messages', patientRoles, () =>
    import('./features/patient/messages/messages.component').then(m => m.MessagesComponent)
  ),

  protectedRoute('doctor/dashboard', doctorRoles, () =>
    import('./features/doctor/dashboard/dashboard.component').then(m => m.DoctorDashboardComponent)
  ),
  protectedRoute('doctor/appointments', doctorRoles, () =>
    import('./features/doctor/appointments/appointments.component').then(m => m.DoctorAppointmentsComponent)
  ),
  protectedRoute('doctor/consultation/:id', doctorRoles, () =>
    import('./features/doctor/consultation/consultation.component').then(m => m.ConsultationComponent)
  ),
  protectedRoute('doctor/messages', doctorRoles, () =>
    import('./features/doctor/messages/messages.component').then(m => m.DoctorMessagesComponent)
  ),

  protectedRoute('pharmacy/dashboard', pharmacyRoles, () =>
    import('./features/pharmacy/dashboard/dashboard.component').then(m => m.PharmacyDashboardComponent)
  ),
  protectedRoute('pharmacy/prescriptions', pharmacyRoles, () =>
    import('./features/pharmacy/prescriptions/prescriptions.component').then(m => m.PrescriptionsComponent)
  ),

  protectedRoute('admin/dashboard', adminRoles, () =>
    import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  ),
  protectedRoute('admin/users', adminRoles, () =>
    import('./features/admin/users/users.component').then(m => m.UserManagementComponent)
  ),
  protectedRoute('admin/create-user', adminRoles, () =>
    import('./features/admin/create-user/create-user.component').then(m => m.CreateUserComponent)
  ),

  { path: '**', redirectTo: '/' }
];
