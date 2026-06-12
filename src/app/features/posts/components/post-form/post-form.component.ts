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

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
