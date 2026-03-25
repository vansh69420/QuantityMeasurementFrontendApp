import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, from, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isProtectedApi =
    req.url.startsWith('/api/quantity') ||
    req.url.startsWith('/api/admin');

  const alreadyRetried = req.headers.get('X-QM-Retry') === '1';

  let cloned = req;

  if (isProtectedApi) {
    const token = auth.getToken();
    if (token) {
      cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(cloned).pipe(
    catchError((err: unknown) => {
      if (!isProtectedApi) {
        return throwError(() => err);
      }

      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      if (err.status !== 401 || alreadyRetried) {
        return throwError(() => err);
      }

      return from(auth.refresh()).pipe(
        switchMap((session) => {
          if (!session?.accessToken) {
            return throwError(() => err);
          }

          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${session.accessToken}`,
              'X-QM-Retry': '1'
            }
          });

          return next(retryReq);
        })
      );
    })
  );
};
