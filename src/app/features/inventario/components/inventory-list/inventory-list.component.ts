import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { Router } from '@angular/router';
import { InventoryItem } from '../../models/inventory.model';
import { InventoryService } from '../../services/inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent implements OnInit {
  items: InventoryItem[] = [];
  displayedColumns: string[] = ['codigo', 'nombre', 'categoria', 'cantidad', 'precioVenta', 'estado', 'acciones'];
  isLoading = true;
  searchTerm = '';
  showLowStockOnly = false;

  constructor(
    private inventoryService: InventoryService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading = true;
    if (this.showLowStockOnly) {
      this.inventoryService.getLowStockItems().subscribe({
        next: (data) => {
          this.items = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading low stock items:', error);
          this.snackBar.open(t('Error al cargar items'), t('Cerrar'), { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.inventoryService.getInventoryItems().subscribe({
        next: (data) => {
          this.items = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading items:', error);
          this.snackBar.open(t('Error al cargar items'), t('Cerrar'), { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  search(): void {
    if (this.searchTerm.trim()) {
      this.inventoryService.searchInventoryItems(this.searchTerm).subscribe({
        next: (data) => {
          this.items = data;
        },
        error: (error) => {
          console.error('Error searching items:', error);
        }
      });
    } else {
      this.loadItems();
    }
  }

  toggleLowStock(): void {
    this.showLowStockOnly = !this.showLowStockOnly;
    this.loadItems();
  }

  viewItem(id: number): void {
    this.router.navigate(['/inventario', id]);
  }

  editItem(id: number): void {
    this.router.navigate(['/inventario', id, 'edit']);
  }

  createItem(): void {
    this.router.navigate(['/inventario/new']);
  }

  deleteItem(id: number): void {
    if (confirm(t('¿Está seguro de eliminar este item?'))) {
      this.inventoryService.deleteInventoryItem(id).subscribe({
        next: () => {
          this.snackBar.open(t('Item eliminado exitosamente'), t('Cerrar'), { duration: 3000 });
          this.loadItems();
        },
        error: (error) => {
          console.error('Error deleting item:', error);
          this.snackBar.open(t('Error al eliminar item'), t('Cerrar'), { duration: 3000 });
        }
      });
    }
  }

  isLowStock(item: InventoryItem): boolean {
    return item.cantidad <= item.cantidadMinima;
  }

  getStockColor(item: InventoryItem): string {
    if (this.isLowStock(item)) return '#f44336';
    if (item.cantidad <= item.cantidadMaxima * 0.5) return '#ff9800';
    return '#4caf50';
  }
}
