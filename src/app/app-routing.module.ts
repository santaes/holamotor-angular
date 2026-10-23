import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'clientes',
    loadChildren: () => import('./features/cliente/cliente.module').then(m => m.ClienteModule)
  },
  {
    path: 'ordenes',
    loadChildren: () => import('./features/orden-reparacion/orden-reparacion.module').then(m => m.OrdenReparacionModule)
  },
  {
    path: 'inventario',
    loadChildren: () => import('./features/inventario/inventario.module').then(m => m.InventarioModule)
  },
  {
    path: 'facturacion',
    loadChildren: () => import('./features/facturacion/facturacion.module').then(m => m.FacturacionModule)
  },
  {
    path: 'citas',
    loadChildren: () => import('./features/citas/citas.module').then(m => m.CitasModule)
  },
  {
    path: 'configuracion',
    loadChildren: () => import('./features/configuracion/configuracion.module').then(m => m.ConfiguracionModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
