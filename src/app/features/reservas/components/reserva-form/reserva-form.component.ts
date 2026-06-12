import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Libro } from '../../../../Core/models/libro.model';
import { Reserva } from '../../../../Core/models/reserva.model';
import { Usuario } from '../../../../Core/models/usuario.model';

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reserva-form.component.html',
  styleUrl: './reserva-form.component.css',
})
export class ReservaFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() reserva: Reserva | null = null;
  @Input() usuarios: Usuario[] = [];
  @Input() libros: Libro[] = [];
  @Input() isLoadingRelations = false;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';
  @Output() save = new EventEmitter<Reserva>();
  @Output() delete = new EventEmitter<Reserva>();
  @Output() restore = new EventEmitter<Reserva>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    libro: ['', Validators.required],
    usuarioSolicitante: ['', Validators.required],
    propietario: ['', Validators.required],
    estado: ['PENDIENTE' as Reserva['estado'], Validators.required],
    fechaSolicitud: ['', Validators.required],
    fechaLimite: [''],
    IsDeleted: [false],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['reserva']) return;
    this.form.reset({
      _id: this.reserva?._id ?? '',
      libro: this.referenceId(this.reserva?.libro),
      usuarioSolicitante: this.referenceId(this.reserva?.usuarioSolicitante),
      propietario: this.referenceId(this.reserva?.propietario),
      estado: this.reserva?.estado ?? 'PENDIENTE',
      fechaSolicitud: this.toLocalDateTime(this.reserva?.fechaSolicitud),
      fechaLimite: this.toLocalDateTime(this.reserva?.fechaLimite),
      IsDeleted: this.reserva?.IsDeleted ?? false,
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.value();
    if (value.usuarioSolicitante === value.propietario) {
      this.form.controls.propietario.setErrors({ sameUser: true });
      return;
    }
    this.save.emit(value);
  }

  onDelete(): void {
    const value = this.value();
    if (value._id) this.delete.emit(value);
  }

  onRestore(): void {
    const value = this.value();
    if (value._id) this.restore.emit(value);
  }

  private value(): Reserva {
    const value = this.form.getRawValue();
    return {
      _id: value._id || undefined,
      libro: value.libro,
      usuarioSolicitante: value.usuarioSolicitante,
      propietario: value.propietario,
      estado: value.estado,
      fechaSolicitud: new Date(value.fechaSolicitud).toISOString(),
      fechaLimite: value.fechaLimite ? new Date(value.fechaLimite).toISOString() : null,
      IsDeleted: value.IsDeleted,
    };
  }

  private referenceId(value?: string | Usuario | Libro): string {
    return typeof value === 'string' ? value : (value?._id ?? '');
  }

  private toLocalDateTime(value?: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
