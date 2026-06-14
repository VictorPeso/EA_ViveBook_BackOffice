import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { AdminListQuery } from '../../../../Core/models/admin-list.model';
import { getApiErrorMessage } from '../../../../Core/models/api-response.model';
import { Libro } from '../../../../Core/models/libro.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { Valoracion } from '../../../../Core/models/valoracion.model';
import { LibrosService } from '../../../../Core/services/libros.service';
import { ToastService } from '../../../../Core/services/toast.service';
import { UsuariosService } from '../../../../Core/services/usuarios.service';
import {
  AdminValoracionSearchField,
  ValoracionesService,
} from '../../../../Core/services/valoraciones.service';
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
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly valoraciones = signal<Valoracion[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly libros = signal<Libro[]>([]);
  readonly selected = signal<Valoracion | null>(null);
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
  readonly searchField = signal<AdminValoracionSearchField>('user');

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
        searchField: this.search() ? this.searchField() : undefined,
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
          this.selected.set(null);
          this.isCreating.set(false);
        },
        error: (error) => this.showError(error, 'No se pudieron cargar las valoraciones.'),
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
        error: (error) => this.showError(error, 'No se pudieron cargar usuarios y libros.'),
      });
  }

  onListQuery(query: AdminListQuery): void {
    this.search.set(query.search);
    this.searchField.set(query.searchField as AdminValoracionSearchField);
    this.currentPage.set(query.page);
    this.pageSize.set(query.pageSize);
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
        this.showSuccess(
          creating ? 'Valoración creada correctamente.' : 'Valoración actualizada correctamente.',
        );
        this.loadValoraciones(saved._id);
      },
      error: (error) => this.showError(error, 'No se pudo guardar la valoración.'),
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
          this.showSuccess('Valoración desactivada correctamente.');
          this.loadValoraciones(updated._id);
        },
        error: (error) => this.showError(error, 'No se pudo desactivar la valoración.'),
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
          this.showSuccess('Valoración restaurada correctamente.');
          this.loadValoraciones(updated._id);
        },
        error: (error) => this.showError(error, 'No se pudo restaurar la valoración.'),
      });
  }

  onPermanentDelete(valoracion: Valoracion): void {
    if (!valoracion._id) return;

    const user =
      typeof valoracion.usuarioAutor === 'string'
        ? valoracion.usuarioAutor
        : valoracion.usuarioAutor.name;
    if (
      !window.confirm(
        `¿Eliminar definitivamente la valoración de "${user}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.service
      .permanentlyDeleteValoracion(valoracion._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          if (this.selected()?._id === valoracion._id) this.onCancel();
          this.showSuccess('Valoración eliminada definitivamente.');
          this.loadValoraciones();
        },
        error: (error) =>
          this.showError(error, 'No se pudo eliminar definitivamente la valoración.'),
      });
  }

  onCancel(): void {
    this.selected.set(null);
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
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
