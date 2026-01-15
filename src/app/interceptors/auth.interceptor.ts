import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Configurar withCredentials para enviar cookies automáticamente
  if (req.url.includes('/api/')) {
    const clonedRequest = req.clone({
      withCredentials: true
    });
    return next(clonedRequest);
  }

  return next(req);
};
