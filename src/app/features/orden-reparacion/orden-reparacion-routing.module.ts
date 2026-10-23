import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderListComponent } from './components/order-list/order-list.component';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';

const routes: Routes = [
  {
    path: '',
    component: OrderListComponent
  },
  {
    path: 'new',
    component: OrderFormComponent
  },
  {
    path: ':id',
    component: OrderDetailComponent
  },
  {
    path: ':id/edit',
    component: OrderFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdenReparacionRoutingModule {}
