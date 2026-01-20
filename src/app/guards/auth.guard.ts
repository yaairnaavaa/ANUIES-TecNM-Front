import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que la sesión se inicialice antes de verificar
  const isAuthenticated = await authService.waitForSessionInit();

  // Verificar si el usuario está autenticado
  if (isAuthenticated) {
    return true;
  }

  // Si no está autenticado, redirigir a login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};
