import { Routes } from '@angular/router';
import { Register } from './register/pages/register/register';
import { Login } from './components/login/login';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { IesGestion } from './pages/ies-gestion/ies-gestion';
import { IesProfileSettings } from './pages/ies-profile-settings/ies-profile-settings';
import { IesCampaignManagementComponent } from './pages/ies-campaign-management/ies-campaign-management';
import { IemsGestion } from './pages/iems-gestion/iems-gestion';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';
import { Aspirant } from './pages/aspirant/aspirant';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [loginGuard],
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      { path: 'ies-gestion', component: IesGestion },
      { path: 'perfil-ies', component: IesProfileSettings },
      { path: 'campaigns', component: IesCampaignManagementComponent },
      { path: 'iems', component: IemsGestion },
      { path: 'aspirant', component: Aspirant},
      { path: '', redirectTo: 'ies-gestion', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
