import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Autor } from '../../../../Core/models/autor.model';
import { Libro, UsuarioRef } from '../../../../Core/models/libro.model';
import { AutoresService } from '../../../../Core/services/autores.service';
import { LibrosService } from '../../../../Core/services/libros.service';
import { LibroFormComponent } from '../../components/libro-form/libro-form.component';
import { LibrosListComponent } from '../../components/libros-list/libros-list.component';
import { Toast } from '../../../../shared/components/toast/toast';

@Component({
  selector: 'app-libros-page',
  standalone: true,
  imports: [CommonModule, LibroFormComponent, LibrosListComponent, Toast],
  templateUrl: './libros-page.component.html',
  styleUrl: './libros-page.component.css',
})
export class LibrosPageComponent implements OnInit {
  private readonly librosService = inject(LibrosService);
  private readonly autoresService = inject(AutoresService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly libros = signal<Libro[]>([]);
  readonly autores = signal<Autor[]>([]);
  readonly selectedLibro = signal<Libro | null>(null);
  readonly isLoading = signal(false);
  readonly isLoadingAutores = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(true);
  readonly isAdmin = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly searchBook = signal('');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAutores();
      this.loadLibros();
    }
  }

  onSearch(term: string): void {
    this.searchBook.set(term.trim());
    this.currentPage.set(1);
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

          this.selectedLibro.set(this.createEmptyLibro());
          this.isCreating.set(true);
        },
        error: (error) => {
          console.error('Error al cargar libros:', error);
          this.errorMessage.set('No se pudieron cargar los libros.');
        },
      });
  }

  loadAutores(): void {
    this.isLoadingAutores.set(true);

    this.autoresService
      .getAdminAutores({ page: 1, limit: 100, includeDeleted: false })
      .pipe(finalize(() => this.isLoadingAutores.set(false)))
      .subscribe({
        next: (result) => this.autores.set(result.data),
        error: (error) => {
          console.error('Error al cargar autores:', error);
          this.errorMessage.set('No se pudieron cargar los autores.');
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
        this.successMessage.set(
          libroData._id ? 'Libro actualizado correctamente.' : 'Libro creado correctamente.',
        );
        this.loadLibros(savedLibro._id);
      },
      error: (error) => {
        console.error('Error al guardar libro:', error);
        this.errorMessage.set(
          error?.error?.message ||
            error?.error?.details?.[0]?.message ||
            'No se pudo guardar el libro.',
        );
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
          this.successMessage.set('Libro desactivado correctamente.');
          this.loadLibros(updatedLibro._id);
        },
        error: (error) => {
          console.error('Error al desactivar libro:', error);
          this.errorMessage.set(error?.error?.message || 'No se pudo desactivar el libro.');
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
          this.successMessage.set('Libro restaurado correctamente.');
          this.loadLibros(updatedLibro._id);
        },
        error: () => this.errorMessage.set('No se pudo restaurar el libro.'),
      });
  }

  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedLibro.set(this.createEmptyLibro());
    this.isCreating.set(true);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadLibros();
  }

  onNextPage(): void {
    this.onPageChange(this.currentPage() + 1);
  }

  onPreviousPage(): void {
    this.onPageChange(this.currentPage() - 1);
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
      authors: this.extractAuthorIds(libro.authors),
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
}
