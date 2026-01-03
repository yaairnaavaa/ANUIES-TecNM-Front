import { Routes } from '@angular/router';
import { Register } from './register/pages/register/register';
import { Login } from './components/login/login';
import { SidebarComponent } from './components/sidebar-component/sidebar-component';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { IesGestion } from './pages/ies-gestion/ies-gestion';
export const routes: Routes = [
  { path: 'register', component: Register },
  { path: 'login', component: Login },
  { path: 'navbar', component: SidebarComponent },
{
    path: 'admin',
    component: AdminLayout, // El contenedor con el Sidebar
    children: [
      {
        path: 'ies-gestion', // La URL final será /admin/ies-gestion
        component: IesGestion
      },
      {
        path: '', // Ruta por defecto dentro de admin
        redirectTo: 'ies-gestion',
        pathMatch: 'full'
      }
    ]
  },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
];
