import { AfterViewInit, Component, DestroyRef, OnInit, computed, effect, inject, untracked, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DOCUMENT, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { PrimeModules } from '@shared/prime-components/prime-components.module';
import { LocalStorageService } from '@core/services/local-storage.service';
import { LoginService } from '@core/services/login.service';
import { LoaderService } from '@core/services/loader.service';
import { CashSessionService } from '@core/services/cash-session.service';
import { OrderWsService } from '@core/services/order-ws.service';
import { ROLES_CODE_SYSTEM } from '@core/enums/roles';
import { configurationLinks, urlsWithPermissions } from '@core/constants/header-links';
import { LOCAL_STORAGE } from '@core/constants/local-storage';
import { LABELS } from '@core/constants/labels';
import { environment } from '@core/environments/environment.development';

/**
 * Cabecera de la referencia (glass sticky, menú filtrado por rol, "Configuraciones", tema
 * claro/oscuro, menú de usuario). Sin panel de notificaciones (Etapa 4) ni "Mi información" (Etapa 2).
 */
@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    imports: [RouterModule, PrimeModules, FormsModule, NgClass]
})
export class HeaderComponent implements OnInit, AfterViewInit {

    readonly menuLogout = viewChild<Menu>('menu');
    readonly menuParameters = viewChild<Menu>('parameters');

    private localStorageService = inject(LocalStorageService);
    public loginService = inject(LoginService);
    private loaderService = inject(LoaderService);
    public cashSessionService = inject(CashSessionService);
    private orderWsService = inject(OrderWsService);
    private destroyRef = inject(DestroyRef);
    private document = inject(DOCUMENT);

    public readonly labels = LABELS;
    public readonly appName = environment.app_name;
    public readonly labelMode: string = LABELS.modeLight + " / " + LABELS.modeDark;
    public themeSelection: boolean = false;
    public backgroundColorHeader: string = 'bg-white-alpha-30';
    public readonly optionsHeader = computed(() =>
        urlsWithPermissions.filter(option => option.show && this.loginService.haveSomeRole(option.access)));
    public readonly configurationLinks = computed<MenuItem[]>(() =>
        urlsWithPermissions
            .filter(link => configurationLinks.includes(link.routerLink) && this.loginService.haveSomeRole(link.access))
            .map(link => ({ label: link.label, icon: link.icon, routerLink: link.routerLink })));
    /** Indicador "Caja abierta / cerrada" para quien cobra. */
    public readonly showCashStatus = computed(() =>
        this.loginService.isLoggedIn() && this.loginService.haveSomeRole([ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.CASHIER]));
    private hideLoaderTimeoutId?: ReturnType<typeof setTimeout>;
    public readonly optionsUser: MenuItem[] = [
        {
            label: LABELS.logout,
            icon: 'pi pi-fw pi-sign-out',
            command: () => this.loginService.logout()
        }
    ];

    constructor() {
        this.themeSelection = this.localStorageService.get(LOCAL_STORAGE.THEME) === 'dark';
        this.changeTheme(false);
        // Tiempo real: una conexión por sesión; /topic/catalog solo para quien usa el POS.
        effect(() => {
            if (this.loginService.isLoggedIn()) {
                const withCatalog = this.loginService.haveSomeRole([ROLES_CODE_SYSTEM.ADMIN, ROLES_CODE_SYSTEM.CASHIER]);
                untracked(() => this.orderWsService.connect(withCatalog));
            } else {
                untracked(() => this.orderWsService.disconnect());
            }
        });
        // Carga el estado de caja una vez al iniciar sesión (POS y caja lo refrescan al entrar).
        effect(() => {
            if (this.showCashStatus() && !untracked(() => this.cashSessionService.loaded())) {
                untracked(() => this.cashSessionService.refresh().subscribe());
            }
        });
    }

    ngOnInit(): void {
        if (this.loginService.userId() === null) {
            this.loginService.setUser();
        }
    }

    ngAfterViewInit(): void {
        this.onWindowScroll();
        fromEvent(this.document, 'scroll')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.onWindowScroll());
    }

    public changeTheme(showLoader: boolean): void {
        const element = this.document.documentElement;
        const theme = this.themeSelection ? 'dark' : 'light';
        element.classList.toggle('cdr-mode-dark', this.themeSelection);
        const themeLink = this.document.getElementById('theme-main') as HTMLLinkElement | null;
        if (themeLink) {
            this.localStorageService.set(LOCAL_STORAGE.THEME, theme);
            themeLink.href = 'styles-' + theme + '.css';
        }
        if (showLoader) {
            this.loaderService.show();
            clearTimeout(this.hideLoaderTimeoutId);
            this.hideLoaderTimeoutId = setTimeout(() => this.loaderService.hide(), 1000);
        }
        this.onWindowScroll();
    }

    public onWindowScroll(): void {
        this.menuLogout()?.hide();
        this.menuParameters()?.hide();
        const scrollPosition = window.scrollY;
        this.backgroundColorHeader = scrollPosition > 350
            ? (this.themeSelection ? 'bg-black-alpha-50' : 'bg-white-alpha-70')
            : scrollPosition > 80
                ? (this.themeSelection ? 'bg-black-alpha-40' : 'bg-white-alpha-50')
                : (this.themeSelection ? 'bg-black-alpha-20' : 'bg-white-alpha-30');
    }
}
