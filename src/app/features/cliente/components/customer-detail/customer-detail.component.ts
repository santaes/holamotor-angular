import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer, Vehicle, Communication } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

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
        this.snackBar.open('Error al cargar cliente', 'Cerrar', { duration: 3000 });
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
    // Implement add vehicle dialog
    this.snackBar.open('Funcionalidad de agregar vehículo en desarrollo', 'Cerrar', { duration: 3000 });
  }

  addCommunication(): void {
    // Implement add communication dialog
    this.snackBar.open('Funcionalidad de agregar comunicación en desarrollo', 'Cerrar', { duration: 3000 });
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
