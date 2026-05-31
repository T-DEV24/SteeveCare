// src/app/app.routes.ts
import { Route, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const publicRoute = (path: string, loadComponent: NonNullable<Route['loadComponent']>): Route => ({
  path,
  loadComponent
});

const protectedChildRoute = (
  path: string,
  roles: string[],
  loadComponent: NonNullable<Route['loadComponent']>
): Route => ({
  path,
  data: { roles },
  loadComponent
});

const protectedRouteGroup = (path: string, roles: string[], children: Route[]): Route => ({
  path,
  canActivate: [authGuard, roleGuard],
  canActivateChild: [authGuard, roleGuard],
  data: { roles },
  children: children.map(child => ({
    ...child,
    data: {
      ...(child.data ?? {}),
      roles: child.data?.['roles'] ?? roles
    }
  }))
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

  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shared/profile/profile.component').then(m => m.ProfileComponent)
  },

  protectedRouteGroup('patient', patientRoles, [
    protectedChildRoute('dashboard', patientRoles, () =>
      import('./features/patient/dashboard/dashboard.component').then(m => m.PatientDashboardComponent)
    ),
    protectedChildRoute('doctors', patientRoles, () =>
      import('./features/patient/doctors/doctors.component').then(m => m.DoctorSearchComponent)
    ),
    protectedChildRoute('doctors/:id', patientRoles, () =>
      import('./features/patient/doctor-detail/doctor-detail.component').then(m => m.DoctorDetailComponent)
    ),
    protectedChildRoute('appointments', patientRoles, () =>
      import('./features/patient/appointments/appointments.component').then(m => m.MyAppointmentsComponent)
    ),
    protectedChildRoute('medical-record', patientRoles, () =>
      import('./features/patient/medical-record/medical-record.component').then(m => m.MedicalRecordComponent)
    ),
    protectedChildRoute('messages', patientRoles, () =>
      import('./features/patient/messages/messages.component').then(m => m.MessagesComponent)
    )
  ]),

  protectedRouteGroup('doctor', doctorRoles, [
    protectedChildRoute('dashboard', doctorRoles, () =>
      import('./features/doctor/dashboard/dashboard.component').then(m => m.DoctorDashboardComponent)
    ),
    protectedChildRoute('appointments', doctorRoles, () =>
      import('./features/doctor/appointments/appointments.component').then(m => m.DoctorAppointmentsComponent)
    ),
    protectedChildRoute('consultation/:id', doctorRoles, () =>
      import('./features/doctor/consultation/consultation.component').then(m => m.ConsultationComponent)
    ),
    protectedChildRoute('messages', doctorRoles, () =>
      import('./features/doctor/messages/messages.component').then(m => m.DoctorMessagesComponent)
    )
  ]),

  protectedRouteGroup('pharmacy', pharmacyRoles, [
    protectedChildRoute('dashboard', pharmacyRoles, () =>
      import('./features/pharmacy/dashboard/dashboard.component').then(m => m.PharmacyDashboardComponent)
    ),
    protectedChildRoute('prescriptions', pharmacyRoles, () =>
      import('./features/pharmacy/prescriptions/prescriptions.component').then(m => m.PrescriptionsComponent)
    )
  ]),

  protectedRouteGroup('admin', adminRoles, [
    protectedChildRoute('dashboard', adminRoles, () =>
      import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
    ),
    protectedChildRoute('analytics', adminRoles, () =>
      import('./features/admin/analytics/analytics.component').then(m => m.AnalyticsComponent)
    ),
    protectedChildRoute('users', adminRoles, () =>
      import('./features/admin/users/users.component').then(m => m.UserManagementComponent)
    ),
    protectedChildRoute('create-user', adminRoles, () =>
      import('./features/admin/create-user/create-user.component').then(m => m.CreateUserComponent)
    )
  ]),

  { path: '**', redirectTo: '/' }
];
