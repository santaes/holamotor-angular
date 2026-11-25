import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VehicleListComponent } from './components/vehicle-list/vehicle-list.component';
import { VehicleFormComponent } from './components/vehicle-form/vehicle-form.component';
import { VehicleDetailComponent } from './components/vehicle-detail/vehicle-detail.component';

const routes: Routes = [
  {
    path: '',
    component: VehicleListComponent
  },
  {
    path: 'new',
    component: VehicleFormComponent
  },
  {
    path: ':customerId/:vehicleId',
    component: VehicleDetailComponent
  },
  {
    path: ':customerId/:vehicleId/edit',
    component: VehicleFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VehiculosRoutingModule {}
