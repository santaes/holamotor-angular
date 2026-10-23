import { Component, OnInit } from '@angular/core';
import { t } from '../../../../core/i18n/i18n';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryItem } from '../../models/inventory.model';
import { InventoryService } from '../../services/inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-inventory-form',
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.css']
})
export class InventoryFormComponent implements OnInit {
  inventoryForm: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  pageTitle = 'Nuevo Item de Inventario';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar
  ) {
    this.inventoryForm = this.createForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.itemId = +id;
      this.isEditMode = true;
      this.pageTitle = 'Editar Item de Inventario';
      this.loadItem(this.itemId);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      codigo: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      categoria: ['', [Validators.required]],
      marca: ['', [Validators.required]],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      cantidadMinima: [0, [Validators.required, Validators.min(0)]],
      cantidadMaxima: [0, [Validators.required, Validators.min(0)]],
      unidadMedida: ['', [Validators.required]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      ubicacion: ['', [Validators.required]],
      proveedorId: [''],
      proveedorNombre: [''],
      estado: ['Activo', [Validators.required]]
    });
  }

  loadItem(id: number): void {
    this.inventoryService.getInventoryItemById(id).subscribe({
      next: (item) => {
        this.inventoryForm.patchValue(item);
      },
      error: (error) => {
        console.error('Error loading item:', error);
        this.snackBar.open(t('Error al cargar item'), t('Cerrar'), { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.inventoryForm.valid) {
      const item: InventoryItem = {
        ...this.inventoryForm.value
      };

      if (this.isEditMode && this.itemId) {
        this.inventoryService.updateInventoryItem(this.itemId, item).subscribe({
          next: () => {
            this.snackBar.open(t('Item actualizado exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/inventario']);
          },
          error: (error) => {
            console.error('Error updating item:', error);
            this.snackBar.open(t('Error al actualizar item'), t('Cerrar'), { duration: 3000 });
          }
        });
      } else {
        this.inventoryService.createInventoryItem(item).subscribe({
          next: () => {
            this.snackBar.open(t('Item creado exitosamente'), t('Cerrar'), { duration: 3000 });
            this.router.navigate(['/inventario']);
          },
          error: (error) => {
            console.error('Error creating item:', error);
            this.snackBar.open(t('Error al crear item'), t('Cerrar'), { duration: 3000 });
          }
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/inventario']);
  }

  getErrorMessage(field: string): string {
    const control = this.inventoryForm.get(field);
    if (control?.hasError('required')) {
      return t('Este campo es requerido');
    }
    if (control?.hasError('min')) {
      return t('Valor mínimo es 0');
    }
    return '';
  }
}
