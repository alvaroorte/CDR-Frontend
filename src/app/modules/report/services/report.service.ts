import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { REPORT_TYPE } from '@core/enums/report-type';
import { environment } from '@core/environments/environment.development';
import {
  OperationsReport, PaymentsReport, ProductsReport, ReportAttachment, ReportFilter, SalesReport
} from '@core/models/report';

/** Reportes (solo ADMIN). Los importes llegan calculados por el backend. */
@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private http = inject(HttpClient);
  private serverUrl: string = environment.server_url + 'report/';

  public getSales(filter: ReportFilter): Observable<SalesReport> {
    return this.http.get<SalesReport>(this.serverUrl + 'sales', { params: this.toParams(filter) });
  }

  public getProducts(filter: ReportFilter): Observable<ProductsReport> {
    return this.http.get<ProductsReport>(this.serverUrl + 'products', { params: this.toParams(filter) });
  }

  public getPayments(filter: ReportFilter): Observable<PaymentsReport> {
    return this.http.get<PaymentsReport>(this.serverUrl + 'payments', { params: this.toParams(filter) });
  }

  public getOperations(filter: ReportFilter): Observable<OperationsReport> {
    return this.http.get<OperationsReport>(this.serverUrl + 'operations', { params: this.toParams(filter) });
  }

  /** Excel generado en el backend (base64). */
  public export(report: REPORT_TYPE, filter: ReportFilter): Observable<ReportAttachment> {
    return this.http.get<ReportAttachment>(this.serverUrl + 'export', { params: this.toParams(filter).set('report', report) });
  }

  /** Solo se envían los filtros con valor. */
  private toParams(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
