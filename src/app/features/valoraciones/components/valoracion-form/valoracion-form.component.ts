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
import { Usuario } from '../../../../Core/models/usuario.model';
import { Valoracion } from '../../../../Core/models/valoracion.model';

@Component({
  selector: 'app-valoracion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './valoracion-form.component.html',
  styleUrl: './valoracion-form.component.css',
})
export class ValoracionFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  @Input() valoracion: Valoracion | null = null;
  @Input() usuarios: Usuario[] = [];
  @Input() libros: Libro[] = [];
  @Input() isLoadingRelations = false;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';
  @Output() save = new EventEmitter<Valoracion>();
  @Output() delete = new EventEmitter<Valoracion>();
  @Output() restore = new EventEmitter<Valoracion>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    usuarioAutor: ['', Validators.required],
    usuarioValorado: ['', Validators.required],
    libro: ['', Validators.required],
    tipoOperacion: ['VENTA' as Valoracion['tipoOperacion'], Validators.required],
    puntuacion: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comentario: [''],
    reservationId: ['', Validators.pattern(/^[0-9a-fA-F]{24}$/)],
    IsDeleted: [false],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['valoracion']) return;
    this.form.reset({
      _id: this.valoracion?._id ?? '',
      usuarioAutor:
        typeof this.valoracion?.usuarioAutor === 'string'
          ? this.valoracion.usuarioAutor
          : (this.valoracion?.usuarioAutor?._id ?? ''),
      usuarioValorado:
        typeof this.valoracion?.usuarioValorado === 'string'
          ? this.valoracion.usuarioValorado
          : (this.valoracion?.usuarioValorado?._id ?? ''),
      libro:
        typeof this.valoracion?.libro === 'string'
          ? this.valoracion.libro
          : (this.valoracion?.libro?._id ?? ''),
      tipoOperacion: this.valoracion?.tipoOperacion ?? 'VENTA',
      puntuacion: this.valoracion?.puntuacion ?? 5,
      comentario: this.valoracion?.comentario ?? '',
      reservationId:
        typeof this.valoracion?.reservationId === 'string' ? this.valoracion.reservationId : '',
      IsDeleted: this.valoracion?.IsDeleted ?? false,
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.value());
  }
  onDelete(): void {
    const value = this.value();
    if (value._id) this.delete.emit(value);
  }
  onRestore(): void {
    const value = this.value();
    if (value._id) this.restore.emit(value);
  }

  private value(): Valoracion {
    const value = this.form.getRawValue();
    return {
      _id: value._id || undefined,
      usuarioAutor: value.usuarioAutor,
      usuarioValorado: value.usuarioValorado,
      libro: value.libro,
      tipoOperacion: value.tipoOperacion,
      puntuacion: Number(value.puntuacion),
      comentario: value.comentario.trim(),
      reservationId: value.reservationId.trim() || null,
      IsDeleted: value.IsDeleted,
    };
  }
}
