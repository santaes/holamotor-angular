import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerListComponent } from './components/customer-list/customer-list.component';
import { CustomerFormComponent } from './components/customer-form/customer-form.component';
import { CustomerDetailComponent } from './components/customer-detail/customer-detail.component';
import { DiagnosisManagementComponent } from './components/diagnosis-management/diagnosis-management.component';

const routes: Routes = [
  {
    path: '',
    component: CustomerListComponent
  },
  {
    path: 'new',
    component: CustomerFormComponent
  },
  {
    path: ':id',
    component: CustomerDetailComponent
  },
  {
    path: ':id/edit',
    component: CustomerFormComponent
  },
  {
    path: 'diagnoses',
    component: DiagnosisManagementComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteRoutingModule {}
