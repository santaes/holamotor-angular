import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Communication } from '../../models/customer.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-communication-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslatePipe
  ],
  templateUrl: './communication-dialog.component.html',
  styleUrls: ['./communication-dialog.component.css']
})
export class CommunicationDialogComponent {
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    tipo: ['Llamada', [Validators.required]],
    fecha: [new Date(), [Validators.required]],
    asunto: ['', [Validators.required, Validators.minLength(2)]],
    mensaje: ['', [Validators.required, Validators.minLength(5)]]
  });

  constructor(
    private dialogRef: MatDialogRef<CommunicationDialogComponent>
  ) {}

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const communication: Communication = {
      tipo: v.tipo as 'Llamada' | 'Email' | 'SMS' | 'WhatsApp',
      fecha: new Date(v.fecha),
      asunto: v.asunto.trim(),
      mensaje: v.mensaje.trim(),
      clienteId: 0 // Will be set by parent
    };
    this.dialogRef.close(communication);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
