import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isSidebarOpen = true;
  currentYear = new Date().getFullYear();
  currentRoute = '/dashboard';

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'people', label: 'Clientes', route: '/clientes' },
    { icon: 'build', label: 'Órdenes de Reparación', route: '/ordenes' },
    { icon: 'inventory_2', label: 'Inventario', route: '/inventario' },
    { icon: 'receipt', label: 'Facturación', route: '/facturacion' },
    { icon: 'calendar_month', label: 'Citas', route: '/citas' }
  ];

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }
}
