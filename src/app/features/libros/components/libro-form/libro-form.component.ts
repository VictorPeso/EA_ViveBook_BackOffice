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
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

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

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    isbn: ['', [Validators.maxLength(100)]],
    IsDeleted: [false],
    authors: this.fb.array<string>([], [Validators.required, Validators.minLength(1)]),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['libro']) {
      this.patchForm(this.libro);
    }
  }

  get titleControl() {
    return this.form.controls.title;
  }

  get isbnControl() {
    return this.form.controls.isbn;
  }

  get authorsControl(): FormArray {
    return this.form.controls.authors;
  }

  get hasLibro(): boolean {
    return !!this.libro;
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
    return this.authorsArrayValues.includes(authorId);
  }

  onToggleAuthor(authorId: string, checked: boolean): void {
    if (checked) {
      if (!this.isAuthorSelected(authorId)) {
        this.authorsControl.push(this.fb.control(authorId, { nonNullable: true }));
      }
    } else {
      const index = this.authorsArrayValues.findIndex((id) => id === authorId);

      if (index >= 0) {
        this.authorsControl.removeAt(index);
      }
    }

    this.authorsControl.markAsTouched();
    this.authorsControl.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.authorsControl.markAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const authorIds = this.getSafeAuthorIds(rawValue.authors);

    const payload: Libro = {
      _id: rawValue._id || undefined,
      title: rawValue.title.trim(),
      isbn: rawValue.isbn.trim(),
      authors: authorIds,
      IsDeleted: rawValue.IsDeleted ?? false,
    };

    this.save.emit(payload);
  }

  private getSafeAuthorIds(values: Array<string | null | undefined>): string[] {
    return values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  }

  onDelete(): void {
    const currentLibro = this.buildCurrentLibroFromForm();

    if (!currentLibro || !currentLibro._id) {
      return;
    }

    this.delete.emit(currentLibro);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  trackByAutorId(index: number, autor: Autor): string | number {
    return autor._id ?? index;
  }

  private patchForm(libro: Libro | null): void {
    const authorIds = this.extractAuthorIds(libro?.authors);

    this.form.reset({
      _id: libro?._id ?? '',
      title: libro?.title ?? '',
      isbn: libro?.isbn ?? '',
      IsDeleted: libro?.IsDeleted ?? false,
      authors: [],
    });

    this.authorsControl.clear();

    authorIds.forEach((authorId) => {
      this.authorsControl.push(this.fb.control(authorId, { nonNullable: true }));
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.authorsControl.updateValueAndValidity();
  }

  private extractAuthorIds(authors: Libro['authors'] | undefined): string[] {
    if (!Array.isArray(authors)) {
      return [];
    }

    return authors
      .map((author) => (typeof author === 'string' ? author : author._id))
      .filter((authorId): authorId is string => !!authorId);
  }

  private buildCurrentLibroFromForm(): Libro | null {
    const rawValue = this.form.getRawValue();
    const authorIds = this.getSafeAuthorIds(rawValue.authors);

    if (!rawValue._id && !rawValue.title.trim() && !rawValue.isbn.trim()) {
      return null;
    }

    return {
      _id: rawValue._id || undefined,
      title: rawValue.title.trim(),
      isbn: rawValue.isbn.trim(),
      authors: authorIds,
      IsDeleted: rawValue.IsDeleted ?? false,
    };
  }

  private get authorsArrayValues(): string[] {
    return this.authorsControl.getRawValue() as string[];
  }
}