import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { authGuard } from './app/core/guards/auth.guard';
import { permissionGuard } from './app/core/guards/permission.guard';
import { CertificateGenerationTypes } from './app/pages/certificate-generation-types/certificate-generation-types';
import { CertificateGenerationTypesDetail } from './app/pages/certificate-generation-types/certificate-generation-types-detail';
import { CertificateGenerationTypesEdit } from './app/pages/certificate-generation-types/certificate-generation-types-edit';
import { CertificateGenerationTypesNew } from './app/pages/certificate-generation-types/certificate-generation-types-new';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { DocumentTypes } from './app/pages/document-types/document-types';
import { DocumentTypesDetail } from './app/pages/document-types/document-types-detail';
import { DocumentTypesEdit } from './app/pages/document-types/document-types-edit';
import { DocumentTypesNew } from './app/pages/document-types/document-types-new';
import { Profile } from './app/pages/profile/profile';
import { QuantityTypes } from './app/pages/quantity-types/quantity-types';
import { QuantityTypesDetail } from './app/pages/quantity-types/quantity-types-detail';
import { QuantityTypesEdit } from './app/pages/quantity-types/quantity-types-edit';
import { QuantityTypesNew } from './app/pages/quantity-types/quantity-types-new';
import { Roles } from './app/pages/roles/roles';
import { RolesDetail } from './app/pages/roles/roles-detail';
import { RolesEdit } from './app/pages/roles/roles-edit';
import { RolesNew } from './app/pages/roles/roles-new';
import { Users } from './app/pages/users/users';
import { UsersNew } from './app/pages/users/users-new';
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
            { path: 'certificate-generation-types/new', component: CertificateGenerationTypesNew, canActivate: [permissionGuard], data: { permissions: ['certificate_generation_types.create'] } },
            { path: 'certificate-generation-types/:id/edit', component: CertificateGenerationTypesEdit, canActivate: [permissionGuard], data: { permissions: ['certificate_generation_types.update'] } },
            { path: 'certificate-generation-types/:id', component: CertificateGenerationTypesDetail, canActivate: [permissionGuard], data: { permissions: ['certificate_generation_types.view'] } },
            { path: 'certificate-generation-types', component: CertificateGenerationTypes, canActivate: [permissionGuard], data: { permissions: ['certificate_generation_types.view'] } },
            { path: 'quantity-types/new', component: QuantityTypesNew, canActivate: [permissionGuard], data: { permissions: ['quantity_types.create'] } },
            { path: 'quantity-types/:id/edit', component: QuantityTypesEdit, canActivate: [permissionGuard], data: { permissions: ['quantity_types.update'] } },
            { path: 'quantity-types/:id', component: QuantityTypesDetail, canActivate: [permissionGuard], data: { permissions: ['quantity_types.view'] } },
            { path: 'quantity-types', component: QuantityTypes, canActivate: [permissionGuard], data: { permissions: ['quantity_types.view'] } },
            { path: 'document-types/new', component: DocumentTypesNew, canActivate: [permissionGuard], data: { permissions: ['document_types.create'] } },
            { path: 'document-types/:id/edit', component: DocumentTypesEdit, canActivate: [permissionGuard], data: { permissions: ['document_types.update'] } },
            { path: 'document-types/:id', component: DocumentTypesDetail, canActivate: [permissionGuard], data: { permissions: ['document_types.view'] } },
            { path: 'document-types', component: DocumentTypes, canActivate: [permissionGuard], data: { permissions: ['document_types.view'] } },
            { path: 'users/new', component: UsersNew, canActivate: [permissionGuard], data: { permissions: ['users.create'] } },
            { path: 'users', component: Users, canActivate: [permissionGuard], data: { permissions: ['users.view'] } },
            { path: 'roles/new', component: RolesNew, canActivate: [permissionGuard], data: { permissions: ['roles.create'] } },
            { path: 'roles/:id/edit', component: RolesEdit, canActivate: [permissionGuard], data: { permissions: ['roles.update'] } },
            { path: 'roles/:id', component: RolesDetail, canActivate: [permissionGuard], data: { permissions: ['roles.view'] } },
            { path: 'roles', component: Roles, canActivate: [permissionGuard], data: { permissions: ['roles.view'] } },
            { path: 'reports', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Reportes', description: 'Modulo preparado para reporte de certificados y exportaciones.', permissions: ['reports.view'] } },
            { path: 'audit-logs', component: FeaturePlaceholder, canActivate: [permissionGuard], data: { title: 'Logs', description: 'Modulo preparado para auditoria en solo lectura.', permissions: ['logs.view'] } }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
