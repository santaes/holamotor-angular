import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  displayedColumns: string[] = ['nombre', 'email', 'telefono', 'nivelLealtad', 'estado', 'acciones'];
  isLoading = true;
  searchTerm = '';

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Error al cargar clientes', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  search(): void {
    if (this.searchTerm.trim()) {
      this.customerService.searchCustomers(this.searchTerm).subscribe({
        next: (data) => {
          this.customers = data;
        },
        error: (error) => {
          console.error('Error searching customers:', error);
        }
      });
    } else {
      this.loadCustomers();
    }
  }

  viewCustomer(id: number): void {
    this.router.navigate(['/clientes', id]);
  }

  editCustomer(id: number): void {
    this.router.navigate(['/clientes', id, 'edit']);
  }

  deleteCustomer(id: number): void {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.snackBar.open('Cliente eliminado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.snackBar.open('Error al eliminar cliente', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  getLoyaltyColor(level: string): string {
    switch (level) {
      case 'Bronce': return '#cd7f32';
      case 'Plata': return '#c0c0c0';
      case 'Oro': return '#ffd700';
      case 'Platino': return '#e5e4e2';
      default: return '#999';
    }
  }

  getEstadoColor(estado: string): string {
    return estado === 'Activo' ? '#4caf50' : '#f44336';
  }
}
