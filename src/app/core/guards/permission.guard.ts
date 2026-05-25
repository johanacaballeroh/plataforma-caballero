import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const permissionGuard: CanActivateFn = async (route): Promise<boolean | UrlTree> => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const permissions = route.data['permissions'] as string[] | undefined;

    await auth.initialize();

    if (auth.hasAnyPermission(permissions)) {
        return true;
    }

    return router.createUrlTree(['/auth/access']);
};
