import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { ActivatedRoute, Router } from '@angular/router';
import { InventoryItem } from '../../models/inventory.model';
import { InventoryService } from '../../services/inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-inventory-detail',
  templateUrl: './inventory-detail.component.html',
  styleUrls: ['./inventory-detail.component.css']
})
export class InventoryDetailComponent implements OnInit {
  item: InventoryItem | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadItem(+id);
    }
  }

  loadItem(id: number): void {
    this.isLoading = true;
    this.inventoryService.getInventoryItemById(id).subscribe({
      next: (item) => {
        this.item = item;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading item:', error);
        this.snackBar.open(t('Error al cargar item'), t('Cerrar'), { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  editItem(): void {
    if (this.item?.id) {
      this.router.navigate(['/inventario', this.item.id, 'edit']);
    }
  }

  isLowStock(): boolean {
    if (!this.item) return false;
    return this.item.cantidad <= this.item.cantidadMinima;
  }

  getStockColor(): string {
    if (!this.item) return '#999';
    if (this.isLowStock()) return '#f44336';
    if (this.item.cantidad <= this.item.cantidadMaxima * 0.5) return '#ff9800';
    return '#4caf50';
  }
}
