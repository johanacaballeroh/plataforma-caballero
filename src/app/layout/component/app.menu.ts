import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@/app/core/auth/auth.service';
import { AppMenuitem } from './app.menuitem';

type GuardedMenuItem = MenuItem & {
    permissions?: string[];
    items?: GuardedMenuItem[];
};

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model(); track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu {
    private readonly auth = inject(AuthService);

    private readonly baseModel: GuardedMenuItem[] = [
        {
            label: 'Principal',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'], permissions: ['dashboard.view'] }]
        },
        {
            label: 'Operacion',
            items: [
                { label: 'Certificados', icon: 'pi pi-fw pi-file-check', routerLink: ['/certificates'], permissions: ['certificates.view', 'certificates.view_own'] },
                { label: 'Empresas', icon: 'pi pi-fw pi-building', routerLink: ['/companies'], permissions: ['companies.view'] },
                { label: 'Items', icon: 'pi pi-fw pi-box', routerLink: ['/items'], permissions: ['items.view'] }
            ]
        },
        {
            label: 'Catalogos',
            items: [
                { label: 'Unidades', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/units'], permissions: ['units.view'] },
                { label: 'Categorias', icon: 'pi pi-fw pi-tags', routerLink: ['/categories'], permissions: ['categories.view'] },
                { label: 'Tipos de items', icon: 'pi pi-fw pi-list-check', routerLink: ['/item-types'], permissions: ['item_types.view'] },
                { label: 'Codigos Basilea', icon: 'pi pi-fw pi-book', routerLink: ['/basel-codes'], permissions: ['basel_codes.view'] },
                { label: 'Tipos de generacion', icon: 'pi pi-fw pi-file-edit', routerLink: ['/certificate-generation-types'], permissions: ['certificate_generation_types.view'] },
                { label: 'Tipos de cantidad', icon: 'pi pi-fw pi-sort-numeric-up', routerLink: ['/quantity-types'], permissions: ['quantity_types.view'] },
                { label: 'Tipos de documentos', icon: 'pi pi-fw pi-paperclip', routerLink: ['/document-types'], permissions: ['document_types.view'] }
            ]
        },
        {
            label: 'Administracion',
            items: [
                { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/users'], permissions: ['users.view'] },
                { label: 'Roles', icon: 'pi pi-fw pi-shield', routerLink: ['/roles'], permissions: ['roles.view'] },
                { label: 'Reportes', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/reports'], permissions: ['reports.view'] },
                { label: 'Logs', icon: 'pi pi-fw pi-history', routerLink: ['/audit-logs'], permissions: ['logs.view'] }
            ]
        },
        {
            label: 'Cuenta',
            items: [{ label: 'Perfil', icon: 'pi pi-fw pi-user', routerLink: ['/profile'] }]
        }
    ];

    readonly model = computed<MenuItem[]>(() => this.filterItems(this.baseModel));

    private filterItems(items: GuardedMenuItem[]): GuardedMenuItem[] {
        return items
            .map((item) => {
                const children = item.items ? this.filterItems(item.items) : undefined;

                return { ...item, items: children };
            })
            .filter((item) => {
                const hasPermission = this.auth.hasAnyPermission(item.permissions);
                const hasChildren = !item.items || item.items.length > 0;

                return hasPermission && hasChildren;
            });
    }
}
