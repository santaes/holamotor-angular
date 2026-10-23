import { Component, OnDestroy } from '@angular/core';
import { SettingsService } from './core/services/settings.service';
import { AppNotification, NotificationService } from './core/services/notification.service';
import { t, LANGUAGES, currentLang, setLang, Lang } from './core/i18n/i18n';
import { NavigationEnd, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatIconRegistry } from '@angular/material/icon';
import { Subscription, filter } from 'rxjs';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  title = 'HolaMotor';

  menuItems: MenuItem[] = [
    { icon: 'space_dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'groups', label: 'Clientes', route: '/clientes' },
    { icon: 'build_circle', label: 'Órdenes de Reparación', route: '/ordenes' },
    { icon: 'inventory_2', label: 'Inventario', route: '/inventario' },
    { icon: 'receipt_long', label: 'Facturación', route: '/facturacion' },
    { icon: 'event', label: 'Citas', route: '/citas' },
    { icon: 'settings', label: 'Configuración', route: '/configuracion' }
  ];

  isMobile = false;
  isSidebarOpen = true;
  isCollapsed = false;
  currentYear = new Date().getFullYear();
  currentRoute = '/dashboard';
  today = new Date();

  notifications: AppNotification[] = [];
  workshopName = '';
  languages = LANGUAGES;
  currentLang = currentLang;

  private subs = new Subscription();

  constructor(
    private router: Router,
    breakpoints: BreakpointObserver,
    iconRegistry: MatIconRegistry,
    private notificationService: NotificationService,
    settingsService: SettingsService
  ) {
    iconRegistry.setDefaultFontSetClass('material-icons-round');

    this.subs.add(notificationService.notifications$.subscribe(list => (this.notifications = list)));
    this.subs.add(settingsService.settings$.subscribe(s => (this.workshopName = s.workshopName)));

    this.subs.add(
      breakpoints.observe('(max-width: 960px)').subscribe(state => {
        this.isMobile = state.matches;
        this.isSidebarOpen = !state.matches;
        if (state.matches) {
          this.isCollapsed = false;
        }
      })
    );

    this.subs.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(e => {
          this.currentRoute = e.urlAfterRedirects;
          if (this.isMobile) {
            this.isSidebarOpen = false;
          }
        })
    );
  }

  get currentSection(): MenuItem {
    return this.menuItems.find(item => this.isActive(item.route)) ?? this.menuItems[0];
  }

  get currentAction(): string {
    const parts = this.currentRoute.split('?')[0].split('/').filter(Boolean);
    if (parts.length < 2) {
      return '';
    }
    if (parts[1] === 'new') {
      return t('Nuevo registro');
    }
    return parts[2] === 'edit' ? t('Editar') : t('Detalle');
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get initials(): string {
    const words = (this.workshopName || 'Holamotor').trim().split(/\s+/);
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  openNotification(n: AppNotification): void {
    this.notificationService.markRead(n.id);
    this.router.navigateByUrl(n.route);
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  get currentLanguageLabel(): string {
    return this.languages.find(l => l.code === this.currentLang)!.label;
  }

  changeLanguage(lang: Lang): void {
    setLang(lang);
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.isSidebarOpen = !this.isSidebarOpen;
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  isActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
