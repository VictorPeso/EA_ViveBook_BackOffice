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

import { Reto } from '../../../../Core/models/reto.model';
import {
  AdminEditorComponent,
  AdminEditorSectionDirective,
} from '../../../../shared/components/admin-editor/admin-editor.component';

@Component({
  selector: 'app-reto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminEditorComponent, AdminEditorSectionDirective],
  templateUrl: './reto-form.component.html',
  styleUrl: './reto-form.component.css',
})
export class RetoFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() reto: Reto | null = null;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';
  @Output() save = new EventEmitter<Reto>();
  @Output() deactivate = new EventEmitter<Reto>();
  @Output() activate = new EventEmitter<Reto>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    type: ['COMPRAR_LIBROS' as Reto['type'], Validators.required],
    objetivo: [1, [Validators.required, Validators.min(1)]],
    activo: [true],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['reto']) return;
    this.form.reset({
      _id: this.reto?._id ?? '',
      title: this.reto?.title ?? '',
      description: this.reto?.description ?? '',
      type: this.reto?.type ?? 'COMPRAR_LIBROS',
      objetivo: this.reto?.objetivo ?? 1,
      activo: this.reto?.activo ?? true,
    });
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo reto' : 'Editar reto';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear un nuevo reto.'
      : 'Modifica la definición y el objetivo del reto seleccionado.';
  }

  formatDate(value?: string): string {
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
    this.save.emit(this.value());
  }

  onDeactivate(): void {
    const value = this.value();
    if (value._id) this.deactivate.emit(value);
  }

  onActivate(): void {
    const value = this.value();
    if (value._id) this.activate.emit(value);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private value(): Reto {
    const value = this.form.getRawValue();
    return {
      _id: value._id || undefined,
      title: value.title.trim(),
      description: value.description.trim(),
      type: value.type,
      objetivo: Number(value.objetivo),
      activo: value.activo,
    };
  }
}
