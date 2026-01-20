import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Configurar withCredentials para enviar cookies automáticamente
  if (req.url.includes('/api/')) {
    const clonedRequest = req.clone({
      withCredentials: true
    });

    return next(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si es 401 y no es la ruta de login, register o verificación de sesión
        if (error.status === 401 && 
            !req.url.includes('/auth/login') && 
            !req.url.includes('/prospects/register') &&
            !req.url.includes('/auth/me')) {
          console.warn('Sesión expirada o no autenticado. Redirigiendo al login...');
          localStorage.clear();
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
