import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { authGuard } from './app/core/guards/auth.guard';
import { permissionGuard } from './app/core/guards/permission.guard';
import { AuditLogs } from './app/pages/audit-logs/audit-logs';
import { BaselCodes } from './app/pages/basel-codes/basel-codes';
import { BaselCodesDetail } from './app/pages/basel-codes/basel-codes-detail';
import { BaselCodesEdit } from './app/pages/basel-codes/basel-codes-edit';
import { BaselCodesNew } from './app/pages/basel-codes/basel-codes-new';
import { Categories } from './app/pages/categories/categories';
import { CategoriesDetail } from './app/pages/categories/categories-detail';
import { CategoriesEdit } from './app/pages/categories/categories-edit';
import { CategoriesNew } from './app/pages/categories/categories-new';
import { CertificateGenerationTypes } from './app/pages/certificate-generation-types/certificate-generation-types';
import { CertificateGenerationTypesDetail } from './app/pages/certificate-generation-types/certificate-generation-types-detail';
import { CertificateGenerationTypesEdit } from './app/pages/certificate-generation-types/certificate-generation-types-edit';
import { CertificateGenerationTypesNew } from './app/pages/certificate-generation-types/certificate-generation-types-new';
import { Certificates } from './app/pages/certificates/certificates';
import { CertificatesDetail } from './app/pages/certificates/certificates-detail';
import { CertificatesEdit } from './app/pages/certificates/certificates-edit';
import { CertificatesNew } from './app/pages/certificates/certificates-new';
import { Companies } from './app/pages/companies/companies';
import { CompaniesDetail } from './app/pages/companies/companies-detail';
import { CompaniesEdit } from './app/pages/companies/companies-edit';
import { CompaniesNew } from './app/pages/companies/companies-new';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { DocumentTypes } from './app/pages/document-types/document-types';
import { DocumentTypesDetail } from './app/pages/document-types/document-types-detail';
import { DocumentTypesEdit } from './app/pages/document-types/document-types-edit';
import { DocumentTypesNew } from './app/pages/document-types/document-types-new';
import { Items } from './app/pages/items/items';
import { ItemsDetail } from './app/pages/items/items-detail';
import { ItemsEdit } from './app/pages/items/items-edit';
import { ItemsNew } from './app/pages/items/items-new';
import { ItemTypes } from './app/pages/item-types/item-types';
import { ItemTypesDetail } from './app/pages/item-types/item-types-detail';
import { ItemTypesEdit } from './app/pages/item-types/item-types-edit';
import { ItemTypesNew } from './app/pages/item-types/item-types-new';
import { Profile } from './app/pages/profile/profile';
import { QuantityTypes } from './app/pages/quantity-types/quantity-types';
import { QuantityTypesDetail } from './app/pages/quantity-types/quantity-types-detail';
import { QuantityTypesEdit } from './app/pages/quantity-types/quantity-types-edit';
import { QuantityTypesNew } from './app/pages/quantity-types/quantity-types-new';
import { Reports } from './app/pages/reports/reports';
import { Roles } from './app/pages/roles/roles';
import { RolesDetail } from './app/pages/roles/roles-detail';
import { RolesEdit } from './app/pages/roles/roles-edit';
import { RolesNew } from './app/pages/roles/roles-new';
import { Units } from './app/pages/units/units';
import { UnitsDetail } from './app/pages/units/units-detail';
import { UnitsEdit } from './app/pages/units/units-edit';
import { UnitsNew } from './app/pages/units/units-new';
import { Users } from './app/pages/users/users';
import { UsersNew } from './app/pages/users/users-new';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard, canActivate: [permissionGuard], data: { permissions: ['dashboard.view'] } },
            { path: 'profile', component: Profile },
            { path: 'certificates/new', component: CertificatesNew, canActivate: [permissionGuard], data: { permissions: ['certificates.create'] } },
            { path: 'certificates/:id/edit', component: CertificatesEdit, canActivate: [permissionGuard], data: { permissions: ['certificates.update'] } },
            { path: 'certificates/:id', component: CertificatesDetail, canActivate: [permissionGuard], data: { permissions: ['certificates.view', 'certificates.view_own'] } },
            { path: 'certificates', component: Certificates, canActivate: [permissionGuard], data: { permissions: ['certificates.view', 'certificates.view_own'] } },
            { path: 'companies/new', component: CompaniesNew, canActivate: [permissionGuard], data: { permissions: ['companies.create'] } },
            { path: 'companies/:id/edit', component: CompaniesEdit, canActivate: [permissionGuard], data: { permissions: ['companies.update'] } },
            { path: 'companies/:id', component: CompaniesDetail, canActivate: [permissionGuard], data: { permissions: ['companies.view'] } },
            { path: 'companies', component: Companies, canActivate: [permissionGuard], data: { permissions: ['companies.view'] } },
            { path: 'items/new', component: ItemsNew, canActivate: [permissionGuard], data: { permissions: ['items.create'] } },
            { path: 'items/:id/edit', component: ItemsEdit, canActivate: [permissionGuard], data: { permissions: ['items.update'] } },
            { path: 'items/:id', component: ItemsDetail, canActivate: [permissionGuard], data: { permissions: ['items.view'] } },
            { path: 'items', component: Items, canActivate: [permissionGuard], data: { permissions: ['items.view'] } },
            { path: 'units/new', component: UnitsNew, canActivate: [permissionGuard], data: { permissions: ['units.create'] } },
            { path: 'units/:id/edit', component: UnitsEdit, canActivate: [permissionGuard], data: { permissions: ['units.update'] } },
            { path: 'units/:id', component: UnitsDetail, canActivate: [permissionGuard], data: { permissions: ['units.view'] } },
            { path: 'units', component: Units, canActivate: [permissionGuard], data: { permissions: ['units.view'] } },
            { path: 'categories/new', component: CategoriesNew, canActivate: [permissionGuard], data: { permissions: ['categories.create'] } },
            { path: 'categories/:id/edit', component: CategoriesEdit, canActivate: [permissionGuard], data: { permissions: ['categories.update'] } },
            { path: 'categories/:id', component: CategoriesDetail, canActivate: [permissionGuard], data: { permissions: ['categories.view'] } },
            { path: 'categories', component: Categories, canActivate: [permissionGuard], data: { permissions: ['categories.view'] } },
            { path: 'item-types/new', component: ItemTypesNew, canActivate: [permissionGuard], data: { permissions: ['item_types.create'] } },
            { path: 'item-types/:id/edit', component: ItemTypesEdit, canActivate: [permissionGuard], data: { permissions: ['item_types.update'] } },
            { path: 'item-types/:id', component: ItemTypesDetail, canActivate: [permissionGuard], data: { permissions: ['item_types.view'] } },
            { path: 'item-types', component: ItemTypes, canActivate: [permissionGuard], data: { permissions: ['item_types.view'] } },
            { path: 'basel-codes/new', component: BaselCodesNew, canActivate: [permissionGuard], data: { permissions: ['basel_codes.create'] } },
            { path: 'basel-codes/:id/edit', component: BaselCodesEdit, canActivate: [permissionGuard], data: { permissions: ['basel_codes.update'] } },
            { path: 'basel-codes/:id', component: BaselCodesDetail, canActivate: [permissionGuard], data: { permissions: ['basel_codes.view'] } },
            { path: 'basel-codes', component: BaselCodes, canActivate: [permissionGuard], data: { permissions: ['basel_codes.view'] } },
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
            { path: 'reports', component: Reports, canActivate: [permissionGuard], data: { permissions: ['reports.view'] } },
            { path: 'audit-logs', component: AuditLogs, canActivate: [permissionGuard], data: { permissions: ['logs.view'] } }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
