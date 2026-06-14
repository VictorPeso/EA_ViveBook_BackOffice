import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminListQuery } from '../../../../Core/models/admin-list.model';
import { getApiErrorMessage } from '../../../../Core/models/api-response.model';
import { Libro } from '../../../../Core/models/libro.model';
import { Post } from '../../../../Core/models/post.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { LibrosService } from '../../../../Core/services/libros.service';
import { AdminPostSearchField, PostsService } from '../../../../Core/services/posts.service';
import { ToastService } from '../../../../Core/services/toast.service';
import { UsuariosService } from '../../../../Core/services/usuarios.service';
import { PostFormComponent } from '../../components/post-form/post-form.component';
import { PostsListComponent } from '../../components/posts-list/posts-list.component';

@Component({
  selector: 'app-posts-page',
  standalone: true,
  imports: [CommonModule, PostFormComponent, PostsListComponent],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.css',
})
export class PostsPage implements OnInit {
  private readonly postsService = inject(PostsService);
  private readonly librosService = inject(LibrosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly posts = signal<Post[]>([]);
  readonly libros = signal<Libro[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly selectedPost = signal<Post | null>(null);
  readonly isLoading = signal(false);
  readonly isLoadingRelations = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly search = signal('');
  readonly searchField = signal<AdminPostSearchField>('book');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRelations();
      this.loadPosts();
    }
  }

  loadPosts(selectedId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.postsService
      .getAdminPosts({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.search(),
        searchField: this.search() ? this.searchField() : undefined,
        includeDeleted: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.posts.set(result.data);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));
          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadPosts(selectedId);
            return;
          }
          const currentId = selectedId ?? this.selectedPost()?._id;
          if (currentId) {
            const refreshed = result.data.find((post) => post._id === currentId);
            if (refreshed) this.selectedPost.set(this.mapToForm(refreshed));
            this.isCreating.set(false);
            return;
          }
          this.selectedPost.set(null);
          this.isCreating.set(false);
        },
        error: (error) => this.showError(error, 'No se pudieron cargar los posts.'),
      });
  }

  loadRelations(): void {
    this.isLoadingRelations.set(true);
    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending === 0) this.isLoadingRelations.set(false);
    };
    this.librosService.getAdminLibros({ page: 1, limit: 100, includeDeleted: false }).subscribe({
      next: (result) => this.libros.set(result.data),
      error: (error) => this.showError(error, 'No se pudieron cargar los libros.'),
      complete: done,
    });
    this.usuariosService
      .getAdminUsuarios({ page: 1, limit: 100, includeDeleted: false })
      .subscribe({
        next: (result) => this.usuarios.set(result.data),
        error: (error) => this.showError(error, 'No se pudieron cargar los usuarios.'),
        complete: done,
      });
  }

  onListQuery(query: AdminListQuery): void {
    this.search.set(query.search);
    this.searchField.set(query.searchField as AdminPostSearchField);
    this.currentPage.set(query.page);
    this.pageSize.set(query.pageSize);
    this.loadPosts();
  }

  onCreateNew(): void {
    this.selectedPost.set(this.createEmpty());
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSelect(post: Post): void {
    this.selectedPost.set(this.mapToForm(post));
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSave(post: Post): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    const creating = this.isCreating() || !post._id;
    const payload = this.buildPayload(post);
    const request = creating
      ? this.postsService.createPost(payload as Post)
      : this.postsService.updatePost(post._id as string, payload);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        this.selectedPost.set(this.mapToForm(saved));
        this.isCreating.set(false);
        this.showSuccess(
          creating ? 'Post creado correctamente.' : 'Post actualizado correctamente.',
        );
        this.loadPosts(saved._id);
      },
      error: (error) => this.showError(error, 'No se pudo guardar el post.'),
    });
  }

  onDelete(post: Post): void {
    if (!post._id || !window.confirm('¿Desactivar este post?')) return;
    this.isDeleting.set(true);
    this.postsService
      .softDeletePost(post._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedPost.set(this.mapToForm(updated));
          this.showSuccess('Post desactivado correctamente.');
          this.loadPosts(updated._id);
        },
        error: (error) => this.showError(error, 'No se pudo desactivar el post.'),
      });
  }

  onRestore(post: Post): void {
    if (!post._id) return;
    this.isDeleting.set(true);
    this.postsService
      .restorePost(post._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedPost.set(this.mapToForm(updated));
          this.showSuccess('Post restaurado correctamente.');
          this.loadPosts(updated._id);
        },
        error: (error) => this.showError(error, 'No se pudo restaurar el post.'),
      });
  }

  onPermanentDelete(post: Post): void {
    if (!post._id) return;

    const book = typeof post.bookId === 'string' ? post.bookId : post.bookId.title;
    if (
      !window.confirm(
        `¿Eliminar definitivamente el post de "${book}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.postsService
      .permanentlyDeletePost(post._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          if (this.selectedPost()?._id === post._id) this.onCancel();
          this.showSuccess('Post eliminado definitivamente.');
          this.loadPosts();
        },
        error: (error) => this.showError(error, 'No se pudo eliminar definitivamente el post.'),
      });
  }

  onCancel(): void {
    this.selectedPost.set(null);
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private createEmpty(): Post {
    return {
      description: '',
      status: 'VENTA',
      imageUrl: '',
      IsDeleted: false,
      ownerId: '',
      bookId: '',
      price: 0,
    };
  }

  private mapToForm(post: Post): Post {
    return {
      ...post,
      imageUrl: post.imageUrl ?? '',
      IsDeleted: post.IsDeleted ?? false,
    };
  }

  private buildPayload(post: Post): Partial<Post> {
    return {
      description: post.description.trim(),
      status: post.status,
      imageUrl: post.imageUrl?.trim() ?? '',
      IsDeleted: post.IsDeleted ?? false,
      ownerId: typeof post.ownerId === 'string' ? post.ownerId : (post.ownerId._id ?? ''),
      bookId: typeof post.bookId === 'string' ? post.bookId : (post.bookId._id ?? ''),
      price: Number(post.price),
    };
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.toastService.success(message);
  }

  private showError(error: unknown, fallbackMessage: string): void {
    const message = getApiErrorMessage(error, fallbackMessage);
    this.errorMessage.set(message);
    this.toastService.error(message);
  }
}
