import { Routes } from '@angular/router';
import { permissionGuard } from '@/app/core/guards/permission.guard';

export default [
    { path: '', pathMatch: 'full', redirectTo: 'services' },
    { path: 'reports', loadComponent: () => import('./ibc-reports').then((m) => m.IbcReportsComponent), canActivate: [permissionGuard], data: { permissions: ['ibc.view'] } },
    { path: 'services', loadComponent: () => import('./ibc-services').then((m) => m.IbcServicesComponent), canActivate: [permissionGuard], data: { permissions: ['ibc.view'] } },
    { path: 'services/:id', loadComponent: () => import('./ibc-service-detail').then((m) => m.IbcServiceDetailComponent), canActivate: [permissionGuard], data: { permissions: ['ibc.view'] } },
    { path: 'containers', loadComponent: () => import('./ibc-registry').then((m) => m.IbcRegistryComponent), canActivate: [permissionGuard], data: { registry: 'containers', permissions: ['ibc.view'] } },
    { path: 'containers/:id', loadComponent: () => import('./ibc-registry').then((m) => m.IbcRegistryComponent), canActivate: [permissionGuard], data: { registry: 'containers', permissions: ['ibc.view'] } },
    { path: 'chemicals', loadComponent: () => import('./ibc-registry').then((m) => m.IbcRegistryComponent), canActivate: [permissionGuard], data: { registry: 'chemicals', permissions: ['ibc_chemicals.view'] } }
] as Routes;
