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
import {
  AdminEditorComponent,
  AdminEditorSectionDirective,
} from '../../../../shared/components/admin-editor/admin-editor.component';

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminEditorComponent, AdminEditorSectionDirective],
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

  get formTitle(): string {
    return this.isCreating ? 'Nueva reserva' : 'Editar reserva';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear una nueva reserva.'
      : 'Modifica el estado, las fechas y las relaciones de la reserva.';
  }

  get solicitanteSeleccionado(): Usuario | null {
    return this.findUsuario(
      this.form.controls.usuarioSolicitante.value,
      this.reserva?.usuarioSolicitante,
    );
  }

  get propietarioSeleccionado(): Usuario | null {
    return this.findUsuario(this.form.controls.propietario.value, this.reserva?.propietario);
  }

  get libroSeleccionado(): Libro | null {
    const libroId = this.form.controls.libro.value;
    if (!libroId) return null;
    const libroFromOptions = this.libros.find((libro) => libro._id === libroId);
    if (libroFromOptions) return libroFromOptions;
    return typeof this.reserva?.libro === 'object' && this.reserva.libro._id === libroId
      ? this.reserva.libro
      : null;
  }

  formatDate(value?: string | null): string {
    if (!value) return 'No disponible';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'No disponible'
      : new Intl.DateTimeFormat('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
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

  onCancel(): void {
    this.cancel.emit();
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

  private findUsuario(
    usuarioId: string,
    currentUsuario: string | Usuario | undefined,
  ): Usuario | null {
    if (!usuarioId) return null;
    const usuarioFromOptions = this.usuarios.find((usuario) => usuario._id === usuarioId);
    if (usuarioFromOptions) return usuarioFromOptions;
    return typeof currentUsuario === 'object' && currentUsuario._id === usuarioId
      ? currentUsuario
      : null;
  }
}
