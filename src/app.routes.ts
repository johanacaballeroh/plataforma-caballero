import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { authGuard } from './app/core/guards/auth.guard';
import { permissionGuard } from './app/core/guards/permission.guard';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Profile } from './app/pages/profile/profile';
import { FeaturePlaceholder } from './app/shared/components/feature-placeholder/feature-placeholder';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard, canActivate: [permissionGuard], data: { permissions: ['dashboard.view'] } },
            { path: 'profile', component: Profile },
            { path: 'certificates', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Certificados', description: 'Modulo preparado para listado, emision, documentos y PDF de certificados.', permissions: ['certificates.view', 'certificates.view_own'] } },
            { path: 'companies', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Empresas', description: 'Modulo preparado para empresas, sedes y contactos.', permissions: ['companies.view'] } },
            { path: 'items', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Items', description: 'Modulo preparado para items valorizables o residuos.', permissions: ['items.view'] } },
            { path: 'units', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Unidades', description: 'Catalogo de unidades de medida.', permissions: ['units.view'] } },
            { path: 'categories', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Categorias', description: 'Catalogo de categorias de items.', permissions: ['categories.view'] } },
            { path: 'item-types', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Tipos de items', description: 'Catalogo de tipos de items.', permissions: ['item_types.view'] } },
            { path: 'basel-codes', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Codigos Basilea', description: 'Catalogo de codigos Basilea.', permissions: ['basel_codes.view'] } },
            { path: 'certificate-generation-types', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Tipos de generacion de certificado', description: 'Catalogo de tipos de generacion y reglas asociadas.', permissions: ['certificate_generation_types.view'] } },
            { path: 'quantity-types', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Tipos de cantidad', description: 'Catalogo de tipos de cantidad.', permissions: ['quantity_types.view'] } },
            { path: 'document-types', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Tipos de documentos', description: 'Catalogo de tipos de documentos adjuntos.', permissions: ['document_types.view'] } },
            { path: 'users', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Usuarios', description: 'Modulo preparado para usuarios, roles y empresas asociadas.', permissions: ['users.view'] } },
            { path: 'roles', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Roles', description: 'Modulo preparado para roles y matriz de permisos.', permissions: ['roles.view'] } },
            { path: 'reports', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Reportes', description: 'Modulo preparado para reporte de certificados y exportaciones.', permissions: ['reports.view'] } },
            { path: 'audit-logs', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Logs', description: 'Modulo preparado para auditoria en solo lectura.', permissions: ['logs.view'] } }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
