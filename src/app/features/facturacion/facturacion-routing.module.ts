import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceListComponent } from './components/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form.component';
import { InvoiceDetailComponent } from './components/invoice-detail/invoice-detail.component';
import { VerifactuSandboxComponent } from './components/verifactu-sandbox/verifactu-sandbox.component';
import { PaymentsListComponent } from './components/payments-list/payments-list.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceListComponent
  },
  {
    path: 'new',
    component: InvoiceFormComponent
  },
  {
    path: 'sandbox',
    component: VerifactuSandboxComponent
  },
  {
    path: 'payments',
    component: PaymentsListComponent
  },
  {
    path: ':id',
    component: InvoiceDetailComponent
  },
  {
    path: ':id/edit',
    component: InvoiceFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FacturacionRoutingModule {}
