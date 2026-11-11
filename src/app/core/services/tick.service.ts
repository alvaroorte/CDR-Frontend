import { Injectable, OnDestroy, signal } from '@angular/core';

/** Reloj compartido para "tiempo transcurrido" (un solo intervalo para todas las tarjetas). */
@Injectable({
  providedIn: 'root'
})
export class TickService implements OnDestroy {

  private readonly _now = signal(Date.now());
  public readonly now = this._now.asReadonly();
  private readonly intervalId = setInterval(() => this._now.set(Date.now()), 15000);

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
