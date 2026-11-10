import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '@core/layout/footer/footer.component';
import { HeaderComponent } from '@core/layout/header/header.component';
import { isMobilePhone } from '@core/utils/device';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { MobileAppRequiredComponent } from '@shared/components/mobile-app-required/mobile-app-required.component';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { PrimeNG } from 'primeng/config';
import { es } from 'src/assets/i18n/es';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, LoaderComponent, HeaderComponent, FooterComponent, MobileAppRequiredComponent, PrimeModules],
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

    private primengConfig = inject(PrimeNG);
    public readonly isMobilePhone = isMobilePhone();

    ngOnInit(): void {
        this.primengConfig.setTranslation(es);
    }
}
