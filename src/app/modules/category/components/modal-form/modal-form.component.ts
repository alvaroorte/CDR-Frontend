import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { CategoryService } from '../../services/category.service';
import { Category } from '@core/models/category';
import { MESSAGES } from '@core/constants/messages';
import { LIMITS } from '@core/constants/limits';
import { regex } from '@core/constants/regexs';
import { LABELS } from '@core/constants/labels';
import { TypeSubmitEnum } from '@core/enums/type-submit';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { ImageInputComponent } from '@shared/components/image-input/image-input.component';
import { CategoryModule } from '../../category.module';

@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, ImageInputComponent, CategoryModule]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private categoryService = inject(CategoryService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public readonly limits = LIMITS;
  private categoryId: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  private tableComponent = this.categoryService.eventTableComponent;

  // Formulario TIPADO (adaptación cdr-frontend)
  public formCategory = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(regex.fieldName), noSpaceValidator]],
    description: this.formBuilder.control<string | null>(null, [Validators.maxLength(LIMITS.maxLengthDescription)]),
    imageBase64: this.formBuilder.control<string | null>(null),
    ranking: [0, [Validators.required, Validators.min(0), Validators.max(999)]],
    active: [true],
  });

  ngOnInit(): void {
    this.categoryService.eventFormComponent.set(this);
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public openCreate(): void {
    this.reset();
    this.titleForm = this.labels.newRegistration("categoría");
    this.openModal = true;
  }

  public openEdit(id: number): void {
    this.reset();
    this.titleForm = this.labels.editRegistration("categoría");
    this.categoryService.getById(id).subscribe({
      next: (res) => {
        this.categoryId = res.id;
        this.formCategory.patchValue(res);
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.formCategory.valid) {
      this.categoryId > 0
        ? this.submit(TypeSubmitEnum.UPDATE)
        : this.submit(TypeSubmitEnum.CREATE);
    }
  }

  private reset(): void {
    this.formCategory.reset();
    this.categoryId = 0;
  }

  private submit(typeSubmitEnum: TypeSubmitEnum): void {
    const { id, ...data } = this.formCategory.getRawValue();
    const body: Partial<Category> = { ...data, description: data.description?.trim() || null };
    const service = typeSubmitEnum === TypeSubmitEnum.CREATE
      ? this.categoryService.create(body)
      : this.categoryService.update(this.categoryId, body);
    service.subscribe({
      next: () => {
        const message = typeSubmitEnum === TypeSubmitEnum.CREATE
          ? MESSAGES.recordCreated
          : MESSAGES.recordUpdated;
        this.helpersService.messageNotification("success", "Correcto", message, 3000);
        this.hideModal();
        this.reset();
      },
      complete: () => {
        this.tableComponent()?.reload();
      }
    });
  }
}
