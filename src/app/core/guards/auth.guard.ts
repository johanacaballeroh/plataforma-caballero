import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = async (_route, state): Promise<boolean | UrlTree> => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.initialize();

    if (auth.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
