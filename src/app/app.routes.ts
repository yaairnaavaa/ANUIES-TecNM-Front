import { Routes } from '@angular/router';
import { Register } from './register/pages/register/register';
import { Login } from './components/login/login';
import { SidebarComponent } from './components/sidebar-component/sidebar-component';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { IesGestion } from './pages/ies-gestion/ies-gestion';
import { IesProfileSettings } from './pages/ies-profile-settings/ies-profile-settings';
export const routes: Routes = [
  { path: 'register', component: Register },
  { path: 'login', component: Login },
  { path: 'navbar', component: SidebarComponent },
  {
    path: 'admin',
    component: AdminLayout, // El contenedor con el Sidebar
    children: [
      { path: 'ies-gestion', component: IesGestion }, // Gestión Nacional (lo que ya tenías)
      { path: 'perfil-ies', component: IesProfileSettings }, // El nuevo componente para los puntos 5.x
      { path: '', redirectTo: 'ies-gestion', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
];
