import { Component, OnDestroy, OnInit, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { IbcOption, ibcErrorMessage } from './ibc.models';
import { IbcService } from './ibc.service';

@Component({
    selector: 'app-ibc-lookup',
    imports: [FormsModule, SelectModule],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IbcLookupComponent), multi: true }],
    template: `
        <p-select [inputId]="inputId()" [ngModel]="value()" (ngModelChange)="select($event)" (onBlur)="touch()"
            [options]="options()" optionLabel="label" optionValue="id" [filter]="true" (onFilter)="search($event.filter)"
            [showClear]="true" [loading]="loading()" [disabled]="disabled()" [placeholder]="placeholder()" appendTo="body" class="w-full" />
    `
})
export class IbcLookupComponent implements ControlValueAccessor, OnInit, OnDestroy {
    private readonly service = inject(IbcService);
    private readonly messages = inject(MessageService);
    readonly kind = input.required<'companies' | 'chemicals' | 'containers'>();
    readonly inputId = input.required<string>();
    readonly placeholder = input('Escribe para buscar');
    readonly initialLabel = input('');
    readonly value = signal<string | null>(null);
    readonly options = signal<IbcOption[]>([]);
    readonly disabled = signal(false);
    readonly loading = signal(false);
    private request = 0;
    private debounce: ReturnType<typeof setTimeout> | undefined;
    private change: (value: string | null) => void = () => undefined;
    touch: () => void = () => undefined;

    ngOnInit(): void { void this.load(''); }
    ngOnDestroy(): void { clearTimeout(this.debounce); this.request++; }

    writeValue(value: string | null): void {
        this.value.set(value);
        this.keepSelected();
    }

    registerOnChange(fn: (value: string | null) => void): void { this.change = fn; }
    registerOnTouched(fn: () => void): void { this.touch = fn; }
    setDisabledState(value: boolean): void { this.disabled.set(value); }

    select(value: string | null): void {
        this.value.set(value);
        this.change(value);
    }

    search(value: string): void {
        clearTimeout(this.debounce);
        this.request++;
        this.debounce = setTimeout(() => void this.load(value), 250);
    }

    private keepSelected(): void {
        const id = this.value();

        if (id && !this.options().some((option) => option.id === id)) this.options.update((options) => [{ id, label: this.initialLabel() || id }, ...options]);
    }

    private async load(search: string): Promise<void> {
        const request = ++this.request;
        const selected = this.options().find((option) => option.id === this.value());

        this.loading.set(true);

        try {
            const options = await this.service.options(this.kind(), search);

            if (request !== this.request) return;
            this.options.set(selected && !options.some((option) => option.id === selected.id) ? [selected, ...options] : options);
            this.keepSelected();
        } catch (error) {
            if (request === this.request) this.messages.add({ severity: 'error', summary: 'Opciones', detail: ibcErrorMessage(error) });
        } finally {
            if (request === this.request) this.loading.set(false);
        }
    }
}
