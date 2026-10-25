import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer, Vehicle, Communication } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { VehicleDialogComponent } from '../vehicle-dialog/vehicle-dialog.component';

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css']
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  vehicles: Vehicle[] = [];
  communications: Communication[] = [];
  isLoading = true;
  selectedTab = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(+id);
    }
  }

  loadCustomer(id: number): void {
    this.isLoading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.loadCustomerData(id);
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.snackBar.open(t('Error al cargar cliente'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadCustomerData(id: number): void {
    this.customerService.getCustomerVehicles(id).subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
      }
    });

    this.customerService.getCommunications(id).subscribe({
      next: (communications) => {
        this.communications = communications;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading communications:', error);
        this.isLoading = false;
      }
    });
  }

  editCustomer(): void {
    if (this.customer?.id) {
      this.router.navigate(['/clientes', this.customer.id, 'edit']);
    }
  }

  addVehicle(): void {
    const dialogRef = this.dialog.open(VehicleDialogComponent, {
      width: '560px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((vehicle: Vehicle) => {
      if (vehicle && this.customer?.id) {
        vehicle.clienteId = this.customer.id;
        this.customerService.addVehicle(this.customer.id, vehicle).subscribe({
          next: (newVehicle) => {
            this.vehicles.push(newVehicle);
            this.snackBar.open(t('Vehículo agregado exitosamente'), t('Cerrar'), { duration: 3000 });
          },
          error: (error) => {
            console.error('Error adding vehicle:', error);
            this.snackBar.open(t('Error al agregar vehículo'), t('Cerrar'), { duration: 3000 });
          }
        });
      }
    });
  }

  addCommunication(): void {
    // Implement add communication dialog
    this.snackBar.open(t('Funcionalidad de agregar comunicación en desarrollo'), t('Cerrar'), { duration: 3000 });
  }

  getLoyaltyColor(level: string): string {
    switch (level) {
      case 'Bronce': return '#b45309';
      case 'Plata': return '#64748b';
      case 'Oro': return '#ca8a04';
      case 'Platino': return '#7c3aed';
      default: return '#999';
    }
  }

  getEstadoColor(estado: string): string {
    return estado === 'Activo' ? '#4caf50' : '#f44336';
  }

  getCommIcon(tipo: string): string {
    switch (tipo) {
      case 'Llamada': return 'phone';
      case 'Email': return 'email';
      case 'SMS': return 'sms';
      case 'WhatsApp': return 'chat';
      default: return 'message';
    }
  }
}
