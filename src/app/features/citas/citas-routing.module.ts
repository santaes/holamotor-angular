import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { AppointmentDetailComponent } from './components/appointment-detail/appointment-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AppointmentListComponent
  },
  {
    path: 'new',
    component: AppointmentFormComponent
  },
  {
    path: ':id',
    component: AppointmentDetailComponent
  },
  {
    path: ':id/edit',
    component: AppointmentFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CitasRoutingModule {}
