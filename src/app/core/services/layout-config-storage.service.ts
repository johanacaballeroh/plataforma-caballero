import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import type { LayoutConfig } from '@/app/layout/service/layout.service';

const STORAGE_KEY = 'plataforma-caballero.layout-config';
const STORAGE_VERSION = 1;
const ALLOWED_PRESETS = ['Aura', 'Lara', 'Nora'];
const ALLOWED_MENU_MODES = ['static', 'overlay'];

type StoredLayoutConfig = {
    version: number;
    config: Partial<LayoutConfig>;
};

@Injectable({
    providedIn: 'root'
})
export class LayoutConfigStorageService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    load(defaultConfig: LayoutConfig): LayoutConfig {
        if (!this.canUseLocalStorage()) {
            return defaultConfig;
        }

        try {
            const storedValue = localStorage.getItem(STORAGE_KEY);

            if (!storedValue) {
                return defaultConfig;
            }

            const storedConfig = JSON.parse(storedValue) as StoredLayoutConfig;

            if (!this.isValidStoredConfig(storedConfig)) {
                this.clear();
                return defaultConfig;
            }

            return {
                ...defaultConfig,
                ...this.normalizeConfig(storedConfig.config)
            };
        } catch {
            this.clear();
            return defaultConfig;
        }
    }

    save(config: LayoutConfig): void {
        if (!this.canUseLocalStorage()) {
            return;
        }

        try {
            const storedConfig: StoredLayoutConfig = {
                version: STORAGE_VERSION,
                config
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(storedConfig));
        } catch {
            return;
        }
    }

    clear(): void {
        if (!this.canUseLocalStorage()) {
            return;
        }

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            return;
        }
    }

    private isValidStoredConfig(value: unknown): value is StoredLayoutConfig {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const storedConfig = value as StoredLayoutConfig;

        return storedConfig.version === STORAGE_VERSION && !!storedConfig.config && typeof storedConfig.config === 'object';
    }

    private normalizeConfig(config: Partial<LayoutConfig>): Partial<LayoutConfig> {
        return {
            ...(this.isAllowedValue(config.preset, ALLOWED_PRESETS) ? { preset: config.preset } : {}),
            ...(typeof config.primary === 'string' ? { primary: config.primary } : {}),
            ...(typeof config.surface === 'string' || config.surface === null ? { surface: config.surface } : {}),
            ...(typeof config.darkTheme === 'boolean' ? { darkTheme: config.darkTheme } : {}),
            ...(this.isAllowedValue(config.menuMode, ALLOWED_MENU_MODES) ? { menuMode: config.menuMode } : {})
        };
    }

    private isAllowedValue(value: unknown, allowedValues: string[]): value is string {
        return typeof value === 'string' && allowedValues.includes(value);
    }

    private canUseLocalStorage(): boolean {
        return this.isBrowser && typeof localStorage !== 'undefined';
    }
}
