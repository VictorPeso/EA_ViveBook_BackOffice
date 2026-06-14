import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminListQuery } from '../../../../Core/models/admin-list.model';
import { getApiErrorMessage } from '../../../../Core/models/api-response.model';
import { Libro, UsuarioRef } from '../../../../Core/models/libro.model';
import { AdminLibroSearchField, LibrosService } from '../../../../Core/services/libros.service';
import { ToastService } from '../../../../Core/services/toast.service';
import { LibroFormComponent } from '../../components/libro-form/libro-form.component';
import { LibrosListComponent } from '../../components/libros-list/libros-list.component';

@Component({
  selector: 'app-libros-page',
  standalone: true,
  imports: [CommonModule, LibroFormComponent, LibrosListComponent],
  templateUrl: './libros-page.component.html',
  styleUrl: './libros-page.component.css',
})
export class LibrosPageComponent implements OnInit {
  private readonly librosService = inject(LibrosService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly libros = signal<Libro[]>([]);
  readonly selectedLibro = signal<Libro | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(false);
  readonly isAdmin = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly searchBook = signal('');
  readonly searchField = signal<AdminLibroSearchField>('title');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadLibros();
    }
  }

  onListQuery(query: AdminListQuery): void {
    this.searchBook.set(query.search);
    this.searchField.set(query.searchField as AdminLibroSearchField);
    this.currentPage.set(query.page);
    this.pageSize.set(query.pageSize);
    this.loadLibros();
  }

  loadLibros(selectedLibroId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.librosService
      .getAdminLibros({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchBook(),
        searchField: this.searchField(),
        includeDeleted: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          const safeLibros = result.data;
          this.libros.set(safeLibros);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));

          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadLibros(selectedLibroId);
            return;
          }

          const selectedId = selectedLibroId ?? this.selectedLibro()?._id;

          if (selectedId) {
            const refreshed = safeLibros.find((libro) => libro._id === selectedId);
            if (refreshed) {
              this.selectedLibro.set(this.mapLibroToFormValue(refreshed));
            }
            this.isCreating.set(false);
            return;
          }

          this.selectedLibro.set(null);
          this.isCreating.set(false);
        },
        error: (error) => {
          console.error('Error al cargar libros:', error);
          this.showError(error, 'No se pudieron cargar los libros.');
        },
      });
  }

  onCreateNew(): void {
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedLibro.set(this.createEmptyLibro());
  }

  onSelectLibro(libro: Libro): void {
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedLibro.set(this.mapLibroToFormValue(libro));
  }

  onSaveLibro(libroData: Libro): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request =
      this.isCreating() || !libroData._id
        ? this.librosService.createLibro(this.buildCreateLibroPayload(libroData))
        : this.librosService.updateLibro(libroData._id, this.buildUpdateLibroPayload(libroData));

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (savedLibro) => {
        this.isCreating.set(false);
        this.selectedLibro.set(this.mapLibroToFormValue(savedLibro));
        this.showSuccess(
          libroData._id ? 'Libro actualizado correctamente.' : 'Libro creado correctamente.',
        );
        this.loadLibros(savedLibro._id);
      },
      error: (error) => {
        console.error('Error al guardar libro:', error);
        this.showError(error, 'No se pudo guardar el libro.');
      },
    });
  }

  onDeleteLibro(libro: Libro): void {
    if (!libro._id || !window.confirm(`¿Desactivar el libro "${libro.title}"?`)) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.librosService
      .softDeleteLibro(libro._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updatedLibro) => {
          this.selectedLibro.set(this.mapLibroToFormValue(updatedLibro));
          this.isCreating.set(false);
          this.showSuccess('Libro desactivado correctamente.');
          this.loadLibros(updatedLibro._id);
        },
        error: (error) => {
          console.error('Error al desactivar libro:', error);
          this.showError(error, 'No se pudo desactivar el libro.');
        },
      });
  }

  onRestore(libro: Libro): void {
    if (!libro._id) return;

    this.isDeleting.set(true);
    this.errorMessage.set('');

    this.librosService
      .restoreLibro(libro._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updatedLibro) => {
          this.selectedLibro.set(this.mapLibroToFormValue(updatedLibro));
          this.showSuccess('Libro restaurado correctamente.');
          this.loadLibros(updatedLibro._id);
        },
        error: (error) => this.showError(error, 'No se pudo restaurar el libro.'),
      });
  }

  onPermanentDelete(libro: Libro): void {
    if (
      !libro._id ||
      !window.confirm(
        `¿Eliminar definitivamente el libro "${libro.title}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.librosService
      .permanentDeleteLibro(libro._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          if (this.selectedLibro()?._id === libro._id) {
            this.selectedLibro.set(null);
          }
          this.showSuccess('Libro eliminado definitivamente.');
          this.loadLibros();
        },
        error: (error) => this.showError(error, 'No se pudo eliminar definitivamente el libro.'),
      });
  }

  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedLibro.set(null);
    this.isCreating.set(false);
  }

  private createEmptyLibro(): Libro {
    return {
      title: '',
      isbn: '',
      authors: [],
      type: 'VENTA',
      precio: 0,
      estado: 'DISPONIBLE',
      IsDeleted: false,
      isReserved: false,
    };
  }

  private mapLibroToFormValue(libro: Libro): Libro {
    return {
      ...libro,
      title: libro.title ?? '',
      isbn: libro.isbn ?? '',
      authors: libro.authors ?? [],
      autor: libro.autor ?? '',
      categoria: libro.categoria ?? '',
      type: libro.type ?? 'VENTA',
      precio: libro.precio ?? 0,
      estado: libro.estado ?? '',
      owner: this.extractUserId(libro.owner),
      IsDeleted: libro.IsDeleted ?? false,
      imageUrl: libro.imageUrl ?? '',
      isReserved: libro.isReserved ?? false,
      reservedBy: this.extractUserId(libro.reservedBy),
    };
  }

  private buildCreateLibroPayload(libro: Libro): Libro {
    return this.buildLibroPayload(libro) as Libro;
  }

  private buildUpdateLibroPayload(libro: Libro): Partial<Libro> {
    return this.buildLibroPayload(libro);
  }

  private buildLibroPayload(libro: Libro): Partial<Libro> {
    return {
      title: libro.title.trim(),
      isbn: libro.isbn.trim(),
      authors: this.extractAuthorIds(libro.authors),
      autor: libro.autor?.trim() ?? '',
      categoria: libro.categoria?.trim() ?? '',
      type: libro.type,
      precio: Number(libro.precio),
      estado: libro.estado.trim(),
      owner: this.optionalString(this.extractUserId(libro.owner)),
      IsDeleted: libro.IsDeleted ?? false,
      rentalStartDate: this.optionalString(libro.rentalStartDate),
      rentalEndDate: this.optionalString(libro.rentalEndDate),
      imageUrl: libro.imageUrl?.trim() ?? '',
      isReserved: libro.isReserved ?? false,
      reservedBy: this.optionalString(this.extractUserId(libro.reservedBy)),
      reservationExpiry: this.optionalString(libro.reservationExpiry),
    };
  }

  private extractAuthorIds(authors: Libro['authors']): string[] {
    return Array.isArray(authors)
      ? authors
          .map((author) => (typeof author === 'string' ? author : author._id))
          .filter((id): id is string => !!id)
      : [];
  }

  private extractUserId(user: string | UsuarioRef | null | undefined): string | undefined {
    if (!user) return undefined;
    return typeof user === 'string' ? user : user._id;
  }

  private optionalString(value: string | null | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
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
