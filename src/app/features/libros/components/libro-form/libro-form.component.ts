import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Autor } from '../../../../Core/models/autor.model';
import { Libro } from '../../../../Core/models/libro.model';

@Component({
  selector: 'app-libro-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './libro-form.component.html',
  styleUrl: './libro-form.component.css',
})
export class LibroFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() libro: Libro | null = null;
  @Input() autores: Autor[] = [];
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() isLoadingAutores = false;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<Libro>();
  @Output() delete = new EventEmitter<Libro>();
  @Output() cancel = new EventEmitter<void>();
  @Output() restoreLibro = new EventEmitter<Libro>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    isbn: ['', [Validators.required, Validators.maxLength(100)]],
    autor: [''],
    categoria: [''],
    type: ['VENTA' as Libro['type'], Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
    estado: ['DISPONIBLE', Validators.required],
    owner: ['', Validators.pattern(/^[0-9a-fA-F]{24}$/)],
    IsDeleted: [false],
    rentalStartDate: [''],
    rentalEndDate: [''],
    imageUrl: ['', Validators.pattern(/^https?:\/\/.+/i)],
    isReserved: [false],
    reservedBy: ['', Validators.pattern(/^[0-9a-fA-F]{24}$/)],
    reservationExpiry: [''],
    authors: this.fb.array<string>([]),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['libro']) {
      this.patchForm(this.libro);
    }
  }

  get authorsControl(): FormArray {
    return this.form.controls.authors;
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo libro' : 'Editar libro';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear un nuevo libro.'
      : 'Modifica los datos del libro seleccionado.';
  }

  isAuthorSelected(authorId: string): boolean {
    return this.authorsControl.getRawValue().includes(authorId);
  }

  onToggleAuthor(authorId: string, checked: boolean): void {
    const index = this.authorsControl.getRawValue().indexOf(authorId);

    if (checked && index < 0) {
      this.authorsControl.push(this.fb.control(authorId, { nonNullable: true }));
    } else if (!checked && index >= 0) {
      this.authorsControl.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.buildCurrentLibroFromForm());
  }

  onDelete(): void {
    const currentLibro = this.buildCurrentLibroFromForm();
    if (currentLibro._id) this.delete.emit(currentLibro);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onRestore(event: Event): void {
    event.stopPropagation();
    const currentLibro = this.buildCurrentLibroFromForm();
    if (currentLibro._id) this.restoreLibro.emit(currentLibro);
  }

  trackByAutorId(index: number, autor: Autor): string | number {
    return autor._id ?? index;
  }

  private patchForm(libro: Libro | null): void {
    this.form.reset({
      _id: libro?._id ?? '',
      title: libro?.title ?? '',
      isbn: libro?.isbn ?? '',
      autor: libro?.autor ?? '',
      categoria: libro?.categoria ?? '',
      type: libro?.type ?? 'VENTA',
      precio: libro?.precio ?? 0,
      estado: libro?.estado ?? 'DISPONIBLE',
      owner: typeof libro?.owner === 'string' ? libro.owner : (libro?.owner?._id ?? ''),
      IsDeleted: libro?.IsDeleted ?? false,
      rentalStartDate: this.toDateTimeLocal(libro?.rentalStartDate),
      rentalEndDate: this.toDateTimeLocal(libro?.rentalEndDate),
      imageUrl: libro?.imageUrl ?? '',
      isReserved: libro?.isReserved ?? false,
      reservedBy:
        typeof libro?.reservedBy === 'string' ? libro.reservedBy : (libro?.reservedBy?._id ?? ''),
      reservationExpiry: this.toDateTimeLocal(libro?.reservationExpiry),
      authors: [],
    });

    this.authorsControl.clear();
    this.extractAuthorIds(libro?.authors).forEach((authorId) => {
      this.authorsControl.push(this.fb.control(authorId, { nonNullable: true }));
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private buildCurrentLibroFromForm(): Libro {
    const value = this.form.getRawValue();
    return {
      _id: value._id || undefined,
      title: value.title.trim(),
      isbn: value.isbn.trim(),
      autor: value.autor.trim(),
      categoria: value.categoria.trim(),
      authors: value.authors.filter((authorId): authorId is string => !!authorId),
      type: value.type,
      precio: Number(value.precio),
      estado: value.estado.trim(),
      owner: value.owner.trim() || undefined,
      IsDeleted: value.IsDeleted,
      rentalStartDate: value.rentalStartDate || undefined,
      rentalEndDate: value.rentalEndDate || undefined,
      imageUrl: value.imageUrl.trim(),
      isReserved: value.isReserved,
      reservedBy: value.reservedBy.trim() || undefined,
      reservationExpiry: value.reservationExpiry || undefined,
    };
  }

  private extractAuthorIds(authors: Libro['authors'] | undefined): string[] {
    return Array.isArray(authors)
      ? authors
          .map((author) => (typeof author === 'string' ? author : author._id))
          .filter((id): id is string => !!id)
      : [];
  }

  private toDateTimeLocal(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
