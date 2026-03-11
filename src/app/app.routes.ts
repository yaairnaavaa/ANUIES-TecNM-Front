import { Routes } from '@angular/router';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((m) => m.Login),
    canActivate: [loginGuard],
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'register/:campaignId',
    loadComponent: () => import('./register/pages/register/register').then((m) => m.Register),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/pages/register/register').then((m) => m.Register),
  },
  {
    path: 'registerStudent/:prospectId',
    loadComponent: () =>
      import('./pages/student-registration/student-registration').then(
        (m) => m.StudentRegistrationComponent,
      ),
  },
  //  Rutas del usuario administrativo de un sistema de universidades
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'ies-gestion',
        loadComponent: () => import('./pages/ies-gestion/ies-gestion').then((m) => m.IesGestion),
      },
      {
        path: 'perfil-ies',
        loadComponent: () =>
          import('./pages/ies-pages/ies-profile-settings/ies-profile-settings').then(
            (m) => m.IesProfileSettings,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/user-profile/user-profile').then((m) => m.UserProfileComponent),
      },
      {
        path: 'campaigns',
        loadComponent: () =>
          import('./pages/ies-campaign-management/ies-campaign-management').then(
            (m) => m.IesCampaignManagementComponent,
          ),
      },
      {
        path: 'iems',
        loadComponent: () => import('./pages/iems-gestion/iems-gestion').then((m) => m.IemsGestion),
      },
      {
        path: 'aspirant',
        loadComponent: () => import('./pages/aspirant/aspirant').then((m) => m.Aspirant),
      },
      {
        path: 'ciclos',
        loadComponent: () => import('./pages/cycles/cycles').then((m) => m.Cycles),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/role-management/role-management').then((m) => m.RoleManagementComponent),
      },
      { path: '', redirectTo: 'ies-gestion', pathMatch: 'full' },
    ],
  },
  // Rutas para usuarios operativos de una universidad
  {
    path: 'ies',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/ies-pages/ies-profile-settings/ies-profile-settings').then(
            (m) => m.IesProfileSettings,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/user-profile/user-profile').then((m) => m.UserProfileComponent),
      },
      {
        path: 'iems',
        loadComponent: () => import('./pages/iems-gestion/iems-gestion').then((m) => m.IemsGestion),
      },
      {
        path: 'siguiente-paso',
        loadComponent: () => import('./pages/next-step/next-step').then((m) => m.NextStep),
      },
      { path: '', redirectTo: 'settings', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
