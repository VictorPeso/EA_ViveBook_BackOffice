import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { Libro } from '../../../../Core/models/libro.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { Valoracion } from '../../../../Core/models/valoracion.model';
import { LibrosService } from '../../../../Core/services/libros.service';
import { UsuariosService } from '../../../../Core/services/usuarios.service';
import { ValoracionesService } from '../../../../Core/services/valoraciones.service';
import { ValoracionFormComponent } from '../../components/valoracion-form/valoracion-form.component';
import { ValoracionesListComponent } from '../../components/valoraciones-list/valoraciones-list.component';

@Component({
  selector: 'app-valoraciones-page',
  standalone: true,
  imports: [CommonModule, ValoracionFormComponent, ValoracionesListComponent],
  templateUrl: './valoraciones-page.component.html',
  styleUrl: './valoraciones-page.component.css',
})
export class ValoracionesPageComponent implements OnInit {
  private readonly service = inject(ValoracionesService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly librosService = inject(LibrosService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly valoraciones = signal<Valoracion[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly libros = signal<Libro[]>([]);
  readonly selected = signal<Valoracion | null>(null);
  readonly isLoading = signal(false);
  readonly isLoadingRelations = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly search = signal('');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRelations();
      this.loadValoraciones();
    }
  }

  loadValoraciones(selectedId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.service
      .getAdminValoraciones({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.search(),
        includeDeleted: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.valoraciones.set(result.data);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));
          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadValoraciones(selectedId);
            return;
          }
          const currentId = selectedId ?? this.selected()?._id;
          if (currentId) {
            const refreshed = result.data.find((item) => item._id === currentId);
            if (refreshed) this.selected.set(this.mapToForm(refreshed));
            this.isCreating.set(false);
            return;
          }
          this.selected.set(this.createEmpty());
          this.isCreating.set(true);
        },
        error: () => this.errorMessage.set('No se pudieron cargar las valoraciones.'),
      });
  }

  loadRelations(): void {
    this.isLoadingRelations.set(true);
    forkJoin({
      usuarios: this.usuariosService.getAdminUsuarios({
        page: 1,
        limit: 100,
        includeDeleted: false,
      }),
      libros: this.librosService.getAdminLibros({ page: 1, limit: 100, includeDeleted: false }),
    })
      .pipe(finalize(() => this.isLoadingRelations.set(false)))
      .subscribe({
        next: ({ usuarios, libros }) => {
          this.usuarios.set(usuarios.data);
          this.libros.set(libros.data);
        },
        error: () => this.errorMessage.set('No se pudieron cargar usuarios y libros.'),
      });
  }

  onSearch(term: string): void {
    this.search.set(term.trim());
    this.currentPage.set(1);
    this.loadValoraciones();
  }

  onCreateNew(): void {
    this.selected.set(this.createEmpty());
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSelect(valoracion: Valoracion): void {
    this.selected.set(this.mapToForm(valoracion));
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSave(valoracion: Valoracion): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    const creating = this.isCreating() || !valoracion._id;
    const payload = this.buildPayload(valoracion);
    const request = creating
      ? this.service.createValoracion(payload as Valoracion)
      : this.service.updateValoracion(valoracion._id as string, payload);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        this.selected.set(this.mapToForm(saved));
        this.isCreating.set(false);
        this.successMessage.set(
          creating ? 'Valoración creada correctamente.' : 'Valoración actualizada correctamente.',
        );
        this.loadValoraciones(saved._id);
      },
      error: (error) =>
        this.errorMessage.set(error?.error?.message || 'No se pudo guardar la valoración.'),
    });
  }

  onDelete(valoracion: Valoracion): void {
    if (!valoracion._id || !window.confirm('¿Desactivar esta valoración?')) return;
    this.isDeleting.set(true);
    this.service
      .softDeleteValoracion(valoracion._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selected.set(this.mapToForm(updated));
          this.successMessage.set('Valoración desactivada correctamente.');
          this.loadValoraciones(updated._id);
        },
        error: () => this.errorMessage.set('No se pudo desactivar la valoración.'),
      });
  }

  onRestore(valoracion: Valoracion): void {
    if (!valoracion._id) return;
    this.isDeleting.set(true);
    this.service
      .restoreValoracion(valoracion._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selected.set(this.mapToForm(updated));
          this.successMessage.set('Valoración restaurada correctamente.');
          this.loadValoraciones(updated._id);
        },
        error: () => this.errorMessage.set('No se pudo restaurar la valoración.'),
      });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadValoraciones();
  }

  onCancel(): void {
    this.selected.set(this.createEmpty());
    this.isCreating.set(true);
  }

  private createEmpty(): Valoracion {
    return {
      usuarioAutor: '',
      usuarioValorado: '',
      libro: '',
      tipoOperacion: 'VENTA',
      puntuacion: 5,
      comentario: '',
      reservationId: null,
      IsDeleted: false,
    };
  }

  private mapToForm(valoracion: Valoracion): Valoracion {
    return {
      ...valoracion,
      usuarioAutor: this.userId(valoracion.usuarioAutor),
      usuarioValorado: this.userId(valoracion.usuarioValorado),
      libro: this.bookId(valoracion.libro),
      reservationId: typeof valoracion.reservationId === 'string' ? valoracion.reservationId : null,
      IsDeleted: valoracion.IsDeleted ?? false,
    };
  }

  private buildPayload(valoracion: Valoracion): Partial<Valoracion> {
    return {
      usuarioAutor: this.userId(valoracion.usuarioAutor),
      usuarioValorado: this.userId(valoracion.usuarioValorado),
      libro: this.bookId(valoracion.libro),
      tipoOperacion: valoracion.tipoOperacion,
      puntuacion: Number(valoracion.puntuacion),
      comentario: valoracion.comentario?.trim() ?? '',
      reservationId: valoracion.reservationId?.trim() || null,
      IsDeleted: valoracion.IsDeleted ?? false,
    };
  }

  private userId(user: string | Usuario): string {
    return typeof user === 'string' ? user : (user._id ?? '');
  }

  private bookId(book: string | Libro): string {
    return typeof book === 'string' ? book : (book._id ?? '');
  }
}
