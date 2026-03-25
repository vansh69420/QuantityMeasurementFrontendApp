import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./features/quantity/dashboard.component').then(m => m.DashboardComponent)
  },

  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
  },

  { path: '**', redirectTo: 'app' }
];
