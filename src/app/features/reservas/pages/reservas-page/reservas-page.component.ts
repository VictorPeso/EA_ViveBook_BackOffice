import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';

import { AdminListQuery } from '../../../../Core/models/admin-list.model';
import { getApiErrorMessage } from '../../../../Core/models/api-response.model';
import { Libro } from '../../../../Core/models/libro.model';
import { Reserva } from '../../../../Core/models/reserva.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { LibrosService } from '../../../../Core/services/libros.service';
import {
  AdminReservaSearchField,
  ReservasService,
} from '../../../../Core/services/reservas.service';
import { ToastService } from '../../../../Core/services/toast.service';
import { UsuariosService } from '../../../../Core/services/usuarios.service';
import { ReservaFormComponent } from '../../components/reserva-form/reserva-form.component';
import { ReservasListComponent } from '../../components/reservas-list/reservas-list.component';

@Component({
  selector: 'app-reservas-page',
  standalone: true,
  imports: [CommonModule, ReservaFormComponent, ReservasListComponent],
  templateUrl: './reservas-page.component.html',
  styleUrl: './reservas-page.component.css',
})
export class ReservasPageComponent implements OnInit {
  private readonly service = inject(ReservasService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly librosService = inject(LibrosService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly reservas = signal<Reserva[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly libros = signal<Libro[]>([]);
  readonly selected = signal<Reserva | null>(null);
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
  readonly searchField = signal<AdminReservaSearchField>('user');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRelations();
      this.loadReservas();
    }
  }

  loadReservas(selectedId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.service
      .getAdminReservas({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.search(),
        searchField: this.search() ? this.searchField() : undefined,
        includeDeleted: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.reservas.set(result.data);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));
          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadReservas(selectedId);
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
        error: (error) => this.showError(error, 'No se pudieron cargar las reservas.'),
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
      libros: this.librosService.getAdminLibros({
        page: 1,
        limit: 100,
        includeDeleted: false,
      }),
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
    this.searchField.set(query.searchField as AdminReservaSearchField);
    this.currentPage.set(query.page);
    this.pageSize.set(query.pageSize);
    this.loadReservas();
  }

  onCreateNew(): void {
    this.selected.set(this.createEmpty());
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSelect(reserva: Reserva): void {
    this.selected.set(this.mapToForm(reserva));
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSave(reserva: Reserva): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    const creating = this.isCreating() || !reserva._id;
    const payload = this.buildPayload(reserva);
    const request = creating
      ? this.service.createReserva(payload as Reserva)
      : this.service.updateReserva(reserva._id as string, payload);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        this.selected.set(this.mapToForm(saved));
        this.isCreating.set(false);
        this.showSuccess(
          creating ? 'Reserva creada correctamente.' : 'Reserva actualizada correctamente.',
        );
        this.loadReservas(saved._id);
      },
      error: (error) => this.showError(error, 'No se pudo guardar la reserva.'),
    });
  }

  onDelete(reserva: Reserva): void {
    if (!reserva._id || !window.confirm('¿Desactivar esta reserva?')) return;
    this.isDeleting.set(true);
    this.service
      .softDeleteReserva(reserva._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selected.set(this.mapToForm(updated));
          this.showSuccess('Reserva desactivada correctamente.');
          this.loadReservas(updated._id);
        },
        error: (error) => this.showError(error, 'No se pudo desactivar la reserva.'),
      });
  }

  onRestore(reserva: Reserva): void {
    if (!reserva._id) return;
    this.isDeleting.set(true);
    this.service
      .restoreReserva(reserva._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selected.set(this.mapToForm(updated));
          this.showSuccess('Reserva restaurada correctamente.');
          this.loadReservas(updated._id);
        },
        error: (error) => this.showError(error, 'No se pudo restaurar la reserva.'),
      });
  }

  onPermanentDelete(reserva: Reserva): void {
    if (!reserva._id) return;

    const book = typeof reserva.libro === 'string' ? reserva.libro : reserva.libro.title;
    if (
      !window.confirm(
        `¿Eliminar definitivamente la reserva de "${book}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.service
      .permanentlyDeleteReserva(reserva._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          if (this.selected()?._id === reserva._id) this.onCancel();
          this.showSuccess('Reserva eliminada definitivamente.');
          this.loadReservas();
        },
        error: (error) => this.showError(error, 'No se pudo eliminar definitivamente la reserva.'),
      });
  }

  onCancel(): void {
    this.selected.set(null);
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private createEmpty(): Reserva {
    return {
      libro: '',
      usuarioSolicitante: '',
      propietario: '',
      estado: 'PENDIENTE',
      fechaSolicitud: new Date().toISOString(),
      fechaLimite: null,
      IsDeleted: false,
    };
  }

  private mapToForm(reserva: Reserva): Reserva {
    return {
      ...reserva,
      IsDeleted: reserva.IsDeleted ?? false,
    };
  }

  private buildPayload(reserva: Reserva): Partial<Reserva> {
    return {
      libro: this.bookId(reserva.libro),
      usuarioSolicitante: this.userId(reserva.usuarioSolicitante),
      propietario: this.userId(reserva.propietario),
      estado: reserva.estado,
      fechaSolicitud: reserva.fechaSolicitud,
      fechaLimite: reserva.fechaLimite || null,
      IsDeleted: reserva.IsDeleted ?? false,
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
