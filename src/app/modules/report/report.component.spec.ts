import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { type Mock } from 'vitest';
import { REPORT_GROUP_BY, REPORT_TYPE } from '@core/enums/report-type';
import { SERVICE_TYPE } from '@core/enums/service-type';
import { environment } from '@core/environments/environment.development';
import { ReportFilter, SalesReport } from '@core/models/report';
import { FileService, MIME_EXCEL } from '@core/services/file-service.service';
import { HelpersService } from '@core/services/helpers.service';
import { CategoryService } from '@modules/category/services/category.service';
import { PaymentMethodService } from '@modules/payment-method/services/payment-method.service';
import { UserService } from '@modules/user/services/user.service';
import { OrderStatusLabelPipe } from '@core/pipes/order-status-label.pipe';
import { PercentBsPipe } from '@core/pipes/percent-bs.pipe';
import { ReportComponent } from './report.component';
import { ReportService } from './services/report.service';

const FILTER: ReportFilter = {
  dateFrom: '2026-11-01', dateTo: '2026-11-11', groupBy: REPORT_GROUP_BY.DAY, userId: null,
  serviceType: SERVICE_TYPE.TAKEAWAY, categoryId: null, paymentMethodId: null
};

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  const URL = `${environment.server_url}report/`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('envía solo los filtros con valor', () => {
    service.getSales(FILTER).subscribe();
    const req = httpMock.expectOne(r => r.url === URL + 'sales');
    expect(req.request.params.keys().sort()).toEqual(['dateFrom', 'dateTo', 'groupBy', 'serviceType']);
    expect(req.request.params.get('serviceType')).toBe('TAKEAWAY');
    req.flush({});
  });

  it('exporta con el tipo de reporte como query param', () => {
    service.export(REPORT_TYPE.PAYMENTS, FILTER).subscribe();
    const req = httpMock.expectOne(r => r.url === URL + 'export');
    expect(req.request.params.get('report')).toBe('PAYMENTS');
    expect(req.request.params.get('dateFrom')).toBe('2026-11-01');
    req.flush({ name: 'x.xlsx', file: 'UEs=', typeFile: 'EXCEL' });
  });
});

describe('FileService.convertBase64ToFile', () => {
  it('decodifica el base64 con nombre y tipo', async () => {
    const file = new FileService().convertBase64ToFile(btoa('PK\u0003\u0004'), 'r.xlsx', MIME_EXCEL);
    expect(file.name).toBe('r.xlsx');
    expect(file.type).toBe(MIME_EXCEL);
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([80, 75, 3, 4]));
  });
});

describe('ReportComponent', () => {
  let component: ReportComponent;
  let reports: { getSales: Mock; getProducts: Mock; getPayments: Mock; getOperations: Mock; export: Mock };
  let files: { convertBase64ToFile: Mock; downloadFile: Mock };
  let helpers: { messageNotification: Mock };
  const sales = { summary: { net: 30 }, periods: [], serviceTypes: [] } as unknown as SalesReport;

  beforeEach(() => {
    reports = {
      getSales: vi.fn().mockReturnValue(of(sales)),
      getProducts: vi.fn().mockReturnValue(of({ products: [], categories: [] })),
      getPayments: vi.fn().mockReturnValue(of({ paymentMethods: [], cashSessions: [] })),
      getOperations: vi.fn().mockReturnValue(of({ users: [], statuses: [], discounts: [], cancellations: [] })),
      export: vi.fn().mockReturnValue(of({ name: 'Reporte Ventas.xlsx', file: 'UEs=', typeFile: 'EXCEL' })),
    };
    files = { convertBase64ToFile: vi.fn().mockReturnValue(new File([], 'x')), downloadFile: vi.fn() };
    helpers = { messageNotification: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ReportService, useValue: reports },
        { provide: FileService, useValue: files },
        { provide: HelpersService, useValue: helpers },
        { provide: UserService, useValue: { getAll: vi.fn().mockReturnValue(of([{ id: 2, fullName: 'María Caja', username: 'maria.caja' }])) } },
        { provide: CategoryService, useValue: { getSelect: vi.fn().mockReturnValue(of([{ id: 1, name: 'Bebidas' }])) } },
        { provide: PaymentMethodService, useValue: { getAll: vi.fn().mockReturnValue(of([{ id: 1, name: 'Efectivo' }])) } },
      ]
    });
    component = TestBed.runInInjectionContext(() => new ReportComponent());
  });

  it('al iniciar carga combos y consulta ventas del mes en curso', () => {
    component.ngOnInit();
    expect(component.users()).toEqual([{ id: 2, name: 'María Caja (maria.caja)' }]);
    expect(component.categories()).toEqual([{ id: 1, name: 'Bebidas' }]);
    expect(reports.getSales).toHaveBeenCalledTimes(1);
    const filter = reports.getSales.mock.calls[0][0] as ReportFilter;
    expect(filter.dateFrom.endsWith('-01')).toBe(true);
    expect(component.sales()).toBe(sales);
    expect(reports.getProducts).not.toHaveBeenCalled();
  });

  it('arma el filtro; un solo día elegido usa la misma fecha como fin', () => {
    component.formFilter.patchValue({ dates: [new Date(2026, 10, 5)], userId: 2, categoryId: 3 });
    expect(component.buildFilter()).toEqual({ dateFrom: '2026-11-05', dateTo: '2026-11-05', groupBy: REPORT_GROUP_BY.DAY,
      userId: 2, serviceType: null, categoryId: 3, paymentMethodId: null });
  });

  it('sin rango de fechas no consulta y avisa', () => {
    component.formFilter.controls.dates.setValue(null);
    component.search();
    expect(reports.getSales).not.toHaveBeenCalled();
    expect(helpers.messageNotification).toHaveBeenCalledWith('warn', expect.any(String), expect.any(String));
  });

  it('cada pestaña se consulta una sola vez por filtro aplicado', () => {
    component.search();
    component.onTabChange(REPORT_TYPE.PRODUCTS);
    component.onTabChange(REPORT_TYPE.SALES);
    component.onTabChange(REPORT_TYPE.PRODUCTS);
    expect(reports.getProducts).toHaveBeenCalledTimes(1);
    expect(reports.getSales).toHaveBeenCalledTimes(1);
    // Nuevo filtro: se descarta lo consultado y se recarga la pestaña activa
    component.search();
    expect(reports.getProducts).toHaveBeenCalledTimes(2);
    expect(component.sales()).toBeNull();
  });

  it('cambiar la agrupación recarga ventas con el nuevo groupBy', () => {
    component.search();
    component.formFilter.controls.groupBy.setValue(REPORT_GROUP_BY.MONTH);
    component.onGroupByChange();
    expect(reports.getSales).toHaveBeenLastCalledWith(expect.objectContaining({ groupBy: REPORT_GROUP_BY.MONTH }));
  });

  it('exporta el reporte de la pestaña activa con el filtro aplicado y descarga el xlsx', () => {
    component.search();
    component.onTabChange(REPORT_TYPE.OPERATIONS);
    component.exportExcel();
    expect(reports.export).toHaveBeenCalledWith(REPORT_TYPE.OPERATIONS, component.appliedFilter());
    expect(files.convertBase64ToFile).toHaveBeenCalledWith('UEs=', 'Reporte Ventas.xlsx', MIME_EXCEL);
    expect(files.downloadFile).toHaveBeenCalled();
    expect(component.exporting()).toBe(false);
  });

  it('un error al exportar libera el botón', () => {
    reports.export.mockReturnValue(throwError(() => ({ code: 500 })));
    component.search();
    component.exportExcel();
    expect(component.exporting()).toBe(false);
    expect(files.downloadFile).not.toHaveBeenCalled();
  });

  it('severidad de estados', () => {
    expect(component.statusSeverity('CANCELLED')).toBe('danger');
    expect(component.statusSeverity('UNKNOWN')).toBe('secondary');
  });
});

describe('Pipes de presentación (Etapa 7)', () => {
  it('orderStatusLabel muestra la etiqueta legible, no la técnica del backend', () => {
    const pipe = new OrderStatusLabelPipe();
    expect(pipe.transform('IN_PREPARATION')).toBe('En preparación');
    expect(pipe.transform('CANCELLED')).toBe('Cancelado');
    expect(pipe.transform(null)).toBe('');
  });

  it('percentBs usa coma decimal como los importes', () => {
    const pipe = new PercentBsPipe();
    expect(pipe.transform(50.34)).toBe('50,34 %');
    expect(pipe.transform(100)).toBe('100,00 %');
    expect(pipe.transform(null)).toBe('');
  });
});
