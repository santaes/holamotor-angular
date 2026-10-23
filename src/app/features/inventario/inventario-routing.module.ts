import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { InventoryFormComponent } from './components/inventory-form/inventory-form.component';
import { InventoryDetailComponent } from './components/inventory-detail/inventory-detail.component';

const routes: Routes = [
  {
    path: '',
    component: InventoryListComponent
  },
  {
    path: 'new',
    component: InventoryFormComponent
  },
  {
    path: ':id',
    component: InventoryDetailComponent
  },
  {
    path: ':id/edit',
    component: InventoryFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventarioRoutingModule {}
