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
import { Post } from '../../../../Core/models/post.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import {
  AdminEditorComponent,
  AdminEditorSectionDirective,
} from '../../../../shared/components/admin-editor/admin-editor.component';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminEditorComponent, AdminEditorSectionDirective],
  templateUrl: './post-form.component.html',
  styleUrl: './post-form.component.css',
})
export class PostFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  @Input() post: Post | null = null;
  @Input() libros: Libro[] = [];
  @Input() usuarios: Usuario[] = [];
  @Input() isLoadingRelations = false;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';
  @Output() save = new EventEmitter<Post>();
  @Output() delete = new EventEmitter<Post>();
  @Output() restore = new EventEmitter<Post>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    description: [''],
    status: ['VENTA' as Post['status'], Validators.required],
    imageUrl: ['', Validators.pattern(/^https?:\/\/.+/i)],
    ownerId: ['', Validators.required],
    bookId: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    IsDeleted: [false],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post']) {
      this.form.reset({
        _id: this.post?._id ?? '',
        description: this.post?.description ?? '',
        status: this.post?.status ?? 'VENTA',
        imageUrl: this.post?.imageUrl ?? '',
        ownerId:
          typeof this.post?.ownerId === 'string'
            ? this.post.ownerId
            : (this.post?.ownerId?._id ?? ''),
        bookId:
          typeof this.post?.bookId === 'string' ? this.post.bookId : (this.post?.bookId?._id ?? ''),
        price: this.post?.price ?? 0,
        IsDeleted: this.post?.IsDeleted ?? false,
      });
    }
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo post' : 'Editar post';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear una nueva publicación.'
      : 'Modifica los datos y relaciones de la publicación seleccionada.';
  }

  get propietarioSeleccionado(): Usuario | null {
    const ownerId = this.form.controls.ownerId.value;
    if (!ownerId) return null;
    const ownerFromOptions = this.usuarios.find((usuario) => usuario._id === ownerId);
    if (ownerFromOptions) return ownerFromOptions;
    return typeof this.post?.ownerId === 'object' && this.post.ownerId._id === ownerId
      ? this.post.ownerId
      : null;
  }

  get libroSeleccionado(): Libro | null {
    const bookId = this.form.controls.bookId.value;
    if (!bookId) return null;
    const bookFromOptions = this.libros.find((libro) => libro._id === bookId);
    if (bookFromOptions) return bookFromOptions;
    return typeof this.post?.bookId === 'object' && this.post.bookId._id === bookId
      ? this.post.bookId
      : null;
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

  onDelete(): void {
    const post = this.value();
    if (post._id) this.delete.emit(post);
  }

  onRestore(): void {
    const post = this.value();
    if (post._id) this.restore.emit(post);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private value(): Post {
    const value = this.form.getRawValue();
    return {
      _id: value._id || undefined,
      description: value.description.trim(),
      status: value.status,
      imageUrl: value.imageUrl.trim(),
      ownerId: value.ownerId,
      bookId: value.bookId,
      price: Number(value.price),
      IsDeleted: value.IsDeleted,
    };
  }
}
