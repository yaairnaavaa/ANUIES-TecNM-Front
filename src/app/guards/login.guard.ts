import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que la sesión se inicialice
  const isAuthenticated = await authService.waitForSessionInit();

  // Si ya está autenticado, redirigir a admin
  if (isAuthenticated) {
    router.navigate(['/admin']);
    return false;
  }

  // Si no está autenticado, permitir acceso al login
  return true;
};
