import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminListQuery } from '../../../../Core/models/admin-list.model';
import { Autor } from '../../../../Core/models/autor.model';
import { getApiErrorMessage } from '../../../../Core/models/api-response.model';
import { AdminAutorSearchField, AutoresService } from '../../../../Core/services/autores.service';
import { ToastService } from '../../../../Core/services/toast.service';
import { AutorFormComponent } from '../../components/autor-form/autor-form.component';
import { AutoresListComponent } from '../../components/autores-list/autores-list.component';

@Component({
  selector: 'app-autores-page',
  standalone: true,
  imports: [CommonModule, AutorFormComponent, AutoresListComponent],
  templateUrl: './autores-page.component.html',
  styleUrl: './autores-page.component.css',
})
export class AutoresPageComponent implements OnInit {
  private readonly autoresService = inject(AutoresService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly autores = signal<Autor[]>([]);
  readonly selectedAutor = signal<Autor | null>(null);

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
  readonly searchAutor = signal('');
  readonly searchField = signal<AdminAutorSearchField>('fullName');

  onListQuery(query: AdminListQuery): void {
    this.searchAutor.set(query.search);
    this.searchField.set(query.searchField as AdminAutorSearchField);
    this.currentPage.set(query.page);
    this.pageSize.set(query.pageSize);
    this.loadAutores();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAutores();
    }
  }

  loadAutores(selectedAutorId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.autoresService
      .getAdminAutores({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchAutor(),
        searchField: this.searchField(),
        includeDeleted: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          const safeAutores = result.data;
          this.autores.set(safeAutores);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));

          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadAutores(selectedAutorId);
            return;
          }

          if (selectedAutorId) {
            const autorRecienAfectado =
              safeAutores.find((autor) => autor._id === selectedAutorId) ?? null;

            if (autorRecienAfectado) {
              this.selectedAutor.set(this.mapAutorToFormValue(autorRecienAfectado));
            }
            this.isCreating.set(false);
            return;
          }

          const selectedId = this.selectedAutor()?._id;

          if (selectedId) {
            const refreshedSelectedAutor =
              safeAutores.find((autor) => autor._id === selectedId) ?? null;

            if (refreshedSelectedAutor) {
              this.selectedAutor.set(this.mapAutorToFormValue(refreshedSelectedAutor));
            }

            return;
          }

          this.selectedAutor.set(null);
          this.isCreating.set(false);
        },
        error: (error) => {
          console.error('Error al cargar autores:', error);
          this.showError(error, 'No se pudieron cargar los autores.');
        },
      });
  }

  onCreateNew(): void {
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedAutor.set(this.createEmptyAutor());
  }

  onSelectAutor(autor: Autor): void {
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedAutor.set(this.mapAutorToFormValue(autor));
  }

  onSaveAutor(autorData: Autor): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.isCreating() || !autorData._id) {
      const createPayload = this.buildCreateAutorPayload(autorData);

      this.autoresService
        .createAutor(createPayload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: (createdAutor) => {
            this.isCreating.set(false);
            this.selectedAutor.set(this.mapAutorToFormValue(createdAutor));
            this.showSuccess('Autor creado correctamente.');

            if (createdAutor._id) {
              this.loadAutores(createdAutor._id);
            } else {
              this.loadAutores();
            }
          },
          error: (error) => {
            console.error('Error al crear autor:', error);
            this.showError(error, 'No se pudo crear el autor.');
          },
        });

      return;
    }

    const updatePayload = this.buildUpdateAutorPayload(autorData);

    this.autoresService
      .updateAutor(autorData._id, updatePayload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updatedAutor) => {
          this.isCreating.set(false);
          this.selectedAutor.set(this.mapAutorToFormValue(updatedAutor));
          this.showSuccess('Autor actualizado correctamente.');

          if (updatedAutor._id) {
            this.loadAutores(updatedAutor._id);
          } else {
            this.loadAutores();
          }
        },
        error: (error) => {
          console.error('Error al actualizar autor:', error);
          this.showError(error, 'No se pudo actualizar el autor.');
        },
      });
  }

  onDeleteAutor(autor: Autor): void {
    if (!autor._id) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres marcar como eliminado al autor "${autor.fullName}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.autoresService
      .softDeleteAutor(autor._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.showSuccess('Autor desactivado correctamente.');
          this.selectedAutor.set(null);
          this.isCreating.set(false);
          this.loadAutores();
        },
        error: (error) => {
          console.error('Error al eliminar autor:', error);
          this.showError(error, 'No se pudo desactivar el autor.');
        },
      });
  }

  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedAutor.set(null);
    this.isCreating.set(false);
  }

  onRestore(autor: Autor): void {
    if (!autor || !autor._id) return;

    this.isLoading.set(true);
    this.autoresService
      .restoreAutor(autor._id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (updatedAutor) => {
          this.selectedAutor.set(this.mapAutorToFormValue(updatedAutor));
          this.isCreating.set(false);
          this.showSuccess('Autor restaurado correctamente.');
          this.loadAutores(updatedAutor._id);
        },
        error: (error) => this.showError(error, 'No se pudo restaurar el autor.'),
      });
  }

  onPermanentDelete(autor: Autor): void {
    if (
      !autor._id ||
      !window.confirm(
        `¿Eliminar definitivamente al autor "${autor.fullName}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.autoresService
      .permanentDeleteAutor(autor._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          if (this.selectedAutor()?._id === autor._id) {
            this.selectedAutor.set(null);
          }
          this.showSuccess('Autor eliminado definitivamente.');
          this.loadAutores();
        },
        error: (error) => this.showError(error, 'No se pudo eliminar definitivamente el autor.'),
      });
  }

  private createEmptyAutor(): Autor {
    return {
      fullName: '',
      IsDeleted: false,
    };
  }

  private mapAutorToFormValue(autor: Autor): Autor {
    return {
      _id: autor._id,
      fullName: autor.fullName ?? '',
      IsDeleted: autor.IsDeleted ?? false,
      createdAt: autor.createdAt,
      updatedAt: autor.updatedAt,
    };
  }

  private buildCreateAutorPayload(autor: Autor): Autor {
    return {
      fullName: autor.fullName.trim(),
      IsDeleted: autor.IsDeleted ?? false,
    };
  }

  private buildUpdateAutorPayload(autor: Autor): Partial<Autor> {
    return {
      fullName: autor.fullName.trim(),
      IsDeleted: autor.IsDeleted ?? false,
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
