import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.getToken()) {
    return true;
  }

  const refreshed = await auth.refresh();
  if (refreshed) {
    return true;
  }

  await router.navigateByUrl('/login');
  return false;
};
