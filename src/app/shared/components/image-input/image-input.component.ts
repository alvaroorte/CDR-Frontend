import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { FileService } from '@core/services/file-service.service';
import { HelpersService } from '@core/services/helpers.service';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { Severity } from '@core/enums/severity';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Selector de imagen con vista previa para formularios reactivos (formControlName).
 * Valor del control: base64 SIN prefijo (como lo guarda el backend) o null.
 * Valida tipo y tamaño en el cliente; el backend vuelve a validar (@IsImageBase64, 1 MB).
 * NUEVO vs referencia: allí app-input-file subía archivos a /media; aquí las imágenes van en base64.
 */
@Component({
  selector: 'app-image-input',
  imports: [PrimeModules],
  templateUrl: './image-input.component.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ImageInputComponent), multi: true }]
})
export class ImageInputComponent implements ControlValueAccessor {

  readonly maxBytes = input<number>(1_048_576);
  readonly inputId = input<string>('image');

  private fileService = inject(FileService);
  private helpersService = inject(HelpersService);

  public readonly labels = LABELS;
  public readonly accept = ACCEPTED_TYPES.join(',');
  public readonly value = signal<string | null>(null);
  public readonly disabled = signal<boolean>(false);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  public get previewSrc(): string | null {
    const value = this.value();
    return value ? `data:image/*;base64,${value}` : null;
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  public async onFileSelected(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    inputElement.value = '';
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.helpersService.messageNotification(Severity.warn, LABELS.warning, MESSAGES.imageInvalidType);
      return;
    }
    if (file.size > this.maxBytes()) {
      this.helpersService.messageNotification(Severity.warn, LABELS.warning, MESSAGES.imageTooLarge);
      return;
    }
    const base64 = await this.fileService.convertFileToBase64(file, true);
    this.setValue(base64);
  }

  public clear(): void {
    this.setValue(null);
  }

  private setValue(value: string | null): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}
