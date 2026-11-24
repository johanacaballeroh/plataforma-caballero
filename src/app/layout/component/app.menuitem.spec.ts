import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppMenuitem } from './app.menuitem';

describe('Categoria Control IBC', () => {
    it('muestra NUEVO en un badge alineado a la derecha del encabezado', async () => {
        await TestBed.configureTestingModule({ imports: [AppMenuitem], providers: [provideRouter([]), provideZonelessChangeDetection()] }).compileComponents();
        const fixture = TestBed.createComponent(AppMenuitem);

        fixture.componentRef.setInput('root', true);
        fixture.componentRef.setInput('item', { label: 'Control IBC', badge: 'NUEVO' });
        fixture.detectChanges();
        await fixture.whenStable();
        const header = fixture.nativeElement.querySelector('.layout-menuitem-root-text') as HTMLElement;
        const badge = header.querySelector('p-badge') as HTMLElement;

        header.style.width = '260px';
        expect(badge.textContent?.trim()).toBe('NUEVO');
        expect(getComputedStyle(header).display).toBe('flex');
        expect(Math.abs(header.getBoundingClientRect().right - badge.getBoundingClientRect().right)).toBeLessThan(2);
        fixture.destroy();
    });
});
