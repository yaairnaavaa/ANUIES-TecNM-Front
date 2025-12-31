import { Routes } from '@angular/router';
import { Register } from './register/pages/register/register';

export const routes: Routes = [
  { path: 'register', component: Register },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
];
