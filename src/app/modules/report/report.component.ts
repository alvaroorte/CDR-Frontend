import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ORDER_STATUS, ORDER_STATUS_SEVERITY } from '@core/enums/order-status';
import { REPORT_GROUP_BY, REPORT_GROUP_BY_LABELS, REPORT_TYPE, REPORT_TYPE_LABELS } from '@core/enums/report-type';
import { SERVICE_TYPE, SERVICE_TYPE_LABELS } from '@core/enums/service-type';
import { OperationsReport, PaymentsReport, ProductsReport, ReportFilter, SalesReport } from '@core/models/report';
import { SelectOption } from '@core/models/select-option';
import { PipesModule } from '@core/pipes/pipes.module';
import { FileService, MIME_EXCEL } from '@core/services/file-service.service';
import { HelpersService } from '@core/services/helpers.service';
import { toIsoDate } from '@core/utils/dates';
import { CategoryService } from '@modules/category/services/category.service';
import { PaymentMethodService } from '@modules/payment-method/services/payment-method.service';
import { UserService } from '@modules/user/services/user.service';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { ReportService } from './services/report.service';

type ReportData = SalesReport | ProductsReport | PaymentsReport | OperationsReport;

/**
 * Reportes (Etapa 6, solo ADMIN): filtros comunes, una pestaña por reporte y exportación a Excel
 * generada en el backend. Cada pestaña se consulta al abrirla y se reutiliza mientras no cambien los filtros.
 */
@Component({
  selector: 'app-report',
  imports: [PrimeModules, PipesModule, ReactiveFormsModule],
  templateUrl: './report.component.html'
})
export class ReportComponent implements OnInit {

  private reportService = inject(ReportService);
  private fileService = inject(FileService);
  private helpersService = inject(HelpersService);
  private userService = inject(UserService);
  private categoryService = inject(CategoryService);
  private paymentMethodService = inject(PaymentMethodService);
  private formBuilder = inject(FormBuilder);

  public readonly REPORT_TYPE = REPORT_TYPE;
  public readonly reportLabels = REPORT_TYPE_LABELS;
  public readonly groupByOptions = Object.values(REPORT_GROUP_BY).map(value => ({ value, label: REPORT_GROUP_BY_LABELS[value] }));
  public readonly serviceTypeOptions = Object.values(SERVICE_TYPE).map(value => ({ value, label: SERVICE_TYPE_LABELS[value] }));
  public readonly maxDate = new Date();

  public activeTab: REPORT_TYPE = REPORT_TYPE.SALES;
  public readonly loading = signal(false);
  public readonly exporting = signal(false);

  public readonly sales = signal<SalesReport | null>(null);
  public readonly products = signal<ProductsReport | null>(null);
  public readonly payments = signal<PaymentsReport | null>(null);
  public readonly operations = signal<OperationsReport | null>(null);

  public readonly users = signal<SelectOption[]>([]);
  public readonly categories = signal<SelectOption[]>([]);
  public readonly paymentMethods = signal<SelectOption[]>([]);

  /** Filtro con el que se consultaron los datos en pantalla (lo que se exporta). */
  public readonly appliedFilter = signal<ReportFilter | null>(null);

  public formFilter = this.formBuilder.group({
    dates: this.formBuilder.control<Date[] | null>(ReportComponent.currentMonth(), Validators.required),
    groupBy: this.formBuilder.control<REPORT_GROUP_BY>(REPORT_GROUP_BY.DAY, { nonNullable: true }),
    userId: this.formBuilder.control<number | null>(null),
    serviceType: this.formBuilder.control<SERVICE_TYPE | null>(null),
    categoryId: this.formBuilder.control<number | null>(null),
    paymentMethodId: this.formBuilder.control<number | null>(null),
  });

  /** Del día 1 del mes actual a hoy. */
  private static currentMonth(): Date[] {
    const today = new Date();
    return [new Date(today.getFullYear(), today.getMonth(), 1), today];
  }

  ngOnInit(): void {
    this.userService.getAll().subscribe(users =>
      this.users.set(users.map(u => ({ id: u.id, name: `${u.fullName} (${u.username})` }))));
    this.categoryService.getSelect().subscribe(categories => this.categories.set(categories));
    this.paymentMethodService.getAll().subscribe(methods =>
      this.paymentMethods.set(methods.map(m => ({ id: m.id, name: m.name }))));
    this.search();
  }

  /** Arma el filtro; null si falta el rango de fechas. Un solo día elegido = desde y hasta ese día. */
  public buildFilter(): ReportFilter | null {
    const { dates, groupBy, userId, serviceType, categoryId, paymentMethodId } = this.formFilter.getRawValue();
    const from = toIsoDate(dates?.[0] ?? null);
    const to = toIsoDate(dates?.[1] ?? dates?.[0] ?? null);
    if (!from || !to) {
      return null;
    }
    return { dateFrom: from, dateTo: to, groupBy, userId, serviceType, categoryId, paymentMethodId };
  }

  /** Aplica los filtros: descarta lo consultado y carga la pestaña activa. */
  public search(): void {
    const filter = this.buildFilter();
    if (!filter) {
      this.formFilter.markAllAsTouched();
      this.helpersService.messageNotification('warn', 'Atención', 'Seleccione el rango de fechas.');
      return;
    }
    this.appliedFilter.set(filter);
    this.sales.set(null);
    this.products.set(null);
    this.payments.set(null);
    this.operations.set(null);
    this.load(this.activeTab);
  }

  public clearFilters(): void {
    this.formFilter.reset({ dates: ReportComponent.currentMonth(), groupBy: REPORT_GROUP_BY.DAY, userId: null,
      serviceType: null, categoryId: null, paymentMethodId: null });
    this.search();
  }

  /** Al cambiar de pestaña se consulta solo si aún no se cargó con el filtro vigente. */
  public onTabChange(value: string | number | undefined): void {
    this.activeTab = value as REPORT_TYPE;
    if (this.appliedFilter() && !this.dataOf(this.activeTab)) {
      this.load(this.activeTab);
    }
  }

  /** La agrupación solo afecta a ventas: se vuelve a consultar al cambiarla. */
  public onGroupByChange(): void {
    const applied = this.appliedFilter();
    if (applied) {
      this.appliedFilter.set({ ...applied, groupBy: this.formFilter.controls.groupBy.value });
      this.load(REPORT_TYPE.SALES);
    }
  }

  public exportExcel(): void {
    const filter = this.appliedFilter();
    if (!filter) {
      return;
    }
    this.exporting.set(true);
    this.reportService.export(this.activeTab, filter).subscribe({
      next: attachment => {
        this.exporting.set(false);
        const file = this.fileService.convertBase64ToFile(attachment.file, attachment.name, MIME_EXCEL);
        this.fileService.downloadFile(file, attachment.name);
      },
      error: () => this.exporting.set(false)
    });
  }

  public statusSeverity(status: string) {
    return ORDER_STATUS_SEVERITY[status as ORDER_STATUS] ?? 'secondary';
  }

  public load(type: REPORT_TYPE): void {
    const filter = this.appliedFilter();
    if (!filter) {
      return;
    }
    this.loading.set(true);
    const request: Observable<ReportData> = {
      [REPORT_TYPE.SALES]: () => this.reportService.getSales(filter),
      [REPORT_TYPE.PRODUCTS]: () => this.reportService.getProducts(filter),
      [REPORT_TYPE.PAYMENTS]: () => this.reportService.getPayments(filter),
      [REPORT_TYPE.OPERATIONS]: () => this.reportService.getOperations(filter),
    }[type]();
    request.subscribe({
      next: data => {
        this.loading.set(false);
        // Descarta respuestas de un filtro que ya fue reemplazado
        if (this.appliedFilter() !== filter) {
          return;
        }
        switch (type) {
          case REPORT_TYPE.SALES: this.sales.set(data as SalesReport); break;
          case REPORT_TYPE.PRODUCTS: this.products.set(data as ProductsReport); break;
          case REPORT_TYPE.PAYMENTS: this.payments.set(data as PaymentsReport); break;
          case REPORT_TYPE.OPERATIONS: this.operations.set(data as OperationsReport); break;
        }
      },
      error: () => this.loading.set(false)
    });
  }

  private dataOf(type: REPORT_TYPE): ReportData | null {
    switch (type) {
      case REPORT_TYPE.SALES: return this.sales();
      case REPORT_TYPE.PRODUCTS: return this.products();
      case REPORT_TYPE.PAYMENTS: return this.payments();
      case REPORT_TYPE.OPERATIONS: return this.operations();
    }
  }
}
