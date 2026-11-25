import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { t } from '../../../../core/i18n/i18n';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Customer, Vehicle, Communication, Document } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { VehicleDialogComponent } from '../vehicle-dialog/vehicle-dialog.component';
import { CommunicationDialogComponent } from '../communication-dialog/communication-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { PdfUploadComponent } from '../../../../core/components/pdf-upload/pdf-upload.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    TranslatePipe,
    MatProgressSpinnerModule,
    PdfUploadComponent],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css']
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  vehicles: Vehicle[] = [];
  communications: Communication[] = [];
  documents: Document[] = [];
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

    this.customerService.getDocuments(id).subscribe({
      next: (documents) => {
        this.documents = documents;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
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
          next: () => {
            // getCustomerVehicles returns the live array — the service push already
            // updated it, so re-fetch instead of pushing a second copy.
            this.loadCustomerData(this.customer!.id);
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
    const dialogRef = this.dialog.open(CommunicationDialogComponent, {
      width: '560px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((communication: Communication) => {
      if (communication && this.customer?.id) {
        communication.clienteId = this.customer.id;
        this.customerService.addCommunication(this.customer.id, communication).subscribe({
          next: () => {
            this.loadCustomerData(this.customer!.id);
            this.snackBar.open(t('Comunicación agregada exitosamente'), t('Cerrar'), { duration: 3000 });
          },
          error: (error) => {
            console.error('Error adding communication:', error);
            this.snackBar.open(t('Error al agregar comunicación'), t('Cerrar'), { duration: 3000 });
          }
        });
      }
    });
  }

  getLoyaltyColor(level: string): string {
    switch (level) {
      case 'Bronce': return '#b45309';
      case 'Plata': return '#64748b';
      case 'Oro': return '#ca8a04';
      case 'Platino': return '#2563eb';
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

  onPdfUploaded(pdfInfo: { filename: string; originalName: string; url: string }): void {
    console.log('PDF uploaded:', pdfInfo);
    // Save document to customer
    if (this.customer?.id) {
      const document: Document = {
        filename: pdfInfo.filename,
        originalName: pdfInfo.originalName,
        url: pdfInfo.url,
        uploadDate: new Date(),
        tipo: 'PDF'
      };
      this.customerService.addDocument(this.customer.id, document).subscribe({
        next: () => {
          this.loadCustomerData(this.customer!.id);
          this.snackBar.open(t('Documento agregado exitosamente'), t('Cerrar'), { duration: 3000 });
        },
        error: (error) => {
          console.error('Error adding document:', error);
          this.snackBar.open(t('Error al agregar documento'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
  }

  onTextExtracted(text: string): void {
    console.log('Text extracted:', text);
    // Store extracted text in customer data
    if (this.customer) {
      if (!this.customer.notas) this.customer.notas = '';
      this.customer.notas += `\n[OCR Text: ${text.substring(0, 200)}...]`;
    }
  }

  viewDocument(doc: Document): void {
    window.open(doc.url, '_blank');
  }

  downloadDocument(doc: Document): void {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  deleteDocument(docId: number): void {
    if (this.customer?.id) {
      this.customerService.deleteDocument(this.customer.id, docId).subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== docId);
          this.snackBar.open(t('Documento eliminado exitosamente'), t('Cerrar'), { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          this.snackBar.open(t('Error al eliminar documento'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
  }
}
