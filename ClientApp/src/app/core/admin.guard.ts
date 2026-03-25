import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getToken()) {
    const refreshed = await auth.refresh();
    if (!refreshed) {
      await router.navigateByUrl('/login');
      return false;
    }
  }

  if (auth.isAdmin()) {
    return true;
  }

  await router.navigateByUrl('/app');
  return false;
};
