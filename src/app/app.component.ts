import { Component, OnDestroy } from '@angular/core';
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
    { icon: 'event', label: 'Citas', route: '/citas' }
  ];

  isMobile = false;
  isSidebarOpen = true;
  isCollapsed = false;
  currentYear = new Date().getFullYear();
  currentRoute = '/dashboard';
  today = new Date();

  private subs = new Subscription();

  constructor(
    private router: Router,
    breakpoints: BreakpointObserver,
    iconRegistry: MatIconRegistry
  ) {
    iconRegistry.setDefaultFontSetClass('material-icons-round');

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
      return 'Nuevo registro';
    }
    return parts[2] === 'edit' ? 'Editar' : 'Detalle';
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
