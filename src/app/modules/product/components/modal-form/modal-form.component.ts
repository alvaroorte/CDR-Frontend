import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { noSpaceValidator } from '@core/validators/noSpaceValidator';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '@modules/category/services/category.service';
import { AddonService } from '@modules/addon/services/addon.service';
import { ProductRequest } from '@core/models/product';
import { SelectOption } from '@core/models/select-option';
import { Addon } from '@core/models/addon';
import { MESSAGES } from '@core/constants/messages';
import { LIMITS } from '@core/constants/limits';
import { regex } from '@core/constants/regexs';
import { LABELS } from '@core/constants/labels';
import { PLACEHOLDERS } from '@core/constants/placeholder';
import { TypeSubmitEnum } from '@core/enums/type-submit';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { ImageInputComponent } from '@shared/components/image-input/image-input.component';
import { ProductModule } from '../../product.module';

/** Reutiliza CategoryService y AddonService para los combos (skill angular-crud §3.4). */
@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, ImageInputComponent, ProductModule]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private addonService = inject(AddonService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  public readonly placeholders = PLACEHOLDERS;
  private productId: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  public categories: SelectOption[] = [];
  public addons: Addon[] = [];
  private tableComponent = this.productService.eventTableComponent;

  public formProduct = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    categoryId: this.formBuilder.control<number | null>(null, [Validators.required]),
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(regex.fieldName), noSpaceValidator]],
    description: this.formBuilder.control<string | null>(null, [Validators.maxLength(LIMITS.maxLengthDescription)]),
    imageBase64: this.formBuilder.control<string | null>(null),
    price: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0)]),
    addonIds: this.formBuilder.nonNullable.control<number[]>([]),
    available: [true],
    active: [true],
  });

  ngOnInit(): void {
    this.productService.eventFormComponent.set(this);
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public openCreate(): void {
    this.reset();
    this.loadCatalogs();
    this.titleForm = this.labels.newRegistration("producto");
    this.openModal = true;
  }

  public openEdit(id: number): void {
    this.reset();
    this.loadCatalogs();
    this.titleForm = this.labels.editRegistration("producto");
    this.productService.getById(id).subscribe({
      next: (res) => {
        this.productId = res.id;
        this.formProduct.patchValue({ ...res, addonIds: res.addons.map(a => a.id) });
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.formProduct.valid) {
      this.productId > 0 ? this.submit(TypeSubmitEnum.UPDATE) : this.submit(TypeSubmitEnum.CREATE);
    }
  }

  /** Los combos se recargan en cada apertura: categorías/adicionales pueden haber cambiado. */
  private loadCatalogs(): void {
    this.categoryService.getSelect().subscribe({ next: (res) => this.categories = res });
    this.addonService.getSelect().subscribe({ next: (res) => this.addons = res });
  }

  private reset(): void {
    this.formProduct.reset();
    this.productId = 0;
  }

  private submit(typeSubmitEnum: TypeSubmitEnum): void {
    const value = this.formProduct.getRawValue();
    const body: ProductRequest = {
      categoryId: value.categoryId ?? 0,
      name: value.name,
      description: value.description?.trim() || null,
      imageBase64: value.imageBase64,
      price: value.price ?? 0,
      available: value.available,
      active: value.active,
      addonIds: value.addonIds,
    };
    const service = typeSubmitEnum === TypeSubmitEnum.CREATE
      ? this.productService.create(body)
      : this.productService.update(this.productId, body);
    service.subscribe({
      next: () => {
        const message = typeSubmitEnum === TypeSubmitEnum.CREATE ? MESSAGES.recordCreated : MESSAGES.recordUpdated;
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
