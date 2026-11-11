import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HelpersService } from '@core/services/helpers.service';
import { TableMarkerService } from '../../services/table-marker.service';
import { TableMarker } from '@core/models/table-marker';
import { MESSAGES } from '@core/constants/messages';
import { LABELS } from '@core/constants/labels';
import { TypeSubmitEnum } from '@core/enums/type-submit';
import { MessageRequiredFieldComponent } from '@shared/components/message-required-field/message-required-field.component';
import { TableMarkerModule } from '../../table-marker.module';

@Component({
    selector: 'app-modal-form',
    templateUrl: './modal-form.component.html',
    imports: [MessageRequiredFieldComponent, TableMarkerModule]
})
export class ModalFormComponent implements OnInit {

  private formBuilder = inject(FormBuilder);
  private helpersService = inject(HelpersService);
  private tableMarkerService = inject(TableMarkerService);

  public readonly labels = LABELS;
  public readonly messages = MESSAGES;
  private tableMarkerId: number = 0;
  public openModal: boolean = false;
  public titleForm: string = "";
  private tableComponent = this.tableMarkerService.eventTableComponent;

  public formTableMarker = this.formBuilder.nonNullable.group({
    id: this.formBuilder.control<number | null>(null),
    number: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(999)]),
    description: this.formBuilder.control<string | null>(null, [Validators.maxLength(255)]),
    active: [true],
  });

  ngOnInit(): void {
    this.tableMarkerService.eventFormComponent.set(this);
  }

  public hideModal(): void {
    this.openModal = false;
  }

  public openCreate(): void {
    this.reset();
    this.titleForm = this.labels.newRegistration("número de mesa");
    this.openModal = true;
  }

  public openEdit(id: number): void {
    this.reset();
    this.titleForm = this.labels.editRegistration("número de mesa");
    this.tableMarkerService.getById(id).subscribe({
      next: (res) => {
        this.tableMarkerId = res.id;
        this.formTableMarker.patchValue(res);
        this.openModal = true;
      }
    });
  }

  public save(): void {
    if (this.formTableMarker.valid) {
      this.tableMarkerId > 0 ? this.submit(TypeSubmitEnum.UPDATE) : this.submit(TypeSubmitEnum.CREATE);
    }
  }

  private reset(): void {
    this.formTableMarker.reset();
    this.tableMarkerId = 0;
  }

  private submit(typeSubmitEnum: TypeSubmitEnum): void {
    const { id, ...data } = this.formTableMarker.getRawValue();
    const body: Partial<TableMarker> = { ...data, number: data.number ?? 0, description: data.description?.trim() || null };
    const service = typeSubmitEnum === TypeSubmitEnum.CREATE
      ? this.tableMarkerService.create(body)
      : this.tableMarkerService.update(this.tableMarkerId, body);
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
