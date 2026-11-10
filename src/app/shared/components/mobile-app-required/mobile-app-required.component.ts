import { Component, signal } from '@angular/core';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { environment } from '@core/environments/environment.development';

/**
 * Bloqueo de teléfonos (patrón de la referencia; core/utils/device.ts ya permite tablets).
 * A diferencia de la referencia no hay app móvil: se pide usar una tablet o computadora.
 */
@Component({
    selector: 'app-mobile-app-required',
    imports: [PrimeModules],
    templateUrl: './mobile-app-required.component.html'
})
export class MobileAppRequiredComponent {
    public readonly appName = environment.app_name;
    public readonly openModal = signal<boolean>(true);
}
