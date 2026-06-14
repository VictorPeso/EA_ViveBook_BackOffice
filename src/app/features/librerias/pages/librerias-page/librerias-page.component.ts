import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminListQuery } from '../../../../Core/models/admin-list.model';
import { Libreria } from '../../../../Core/models/libreria.model';
import { getApiErrorMessage } from '../../../../Core/models/api-response.model';
import {
  AdminLibreriaSearchField,
  LibreriasService,
} from '../../../../Core/services/librerias.service';
import { ToastService } from '../../../../Core/services/toast.service';
import { LibreriaFormComponent } from '../../components/libreria-form/libreria-form.component';
import { LibreriasListComponent } from '../../components/librerias-list/librerias-list.component';

@Component({
  selector: 'app-librerias-page',
  standalone: true,
  imports: [CommonModule, LibreriaFormComponent, LibreriasListComponent],
  templateUrl: './librerias-page.component.html',
  styleUrl: './librerias-page.component.css',
})
export class LibreriasPageComponent implements OnInit {
  private readonly service = inject(LibreriasService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly librerias = signal<Libreria[]>([]);
  readonly selectedLibreria = signal<Libreria | null>(null);
  readonly isLoading = signal(false);
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
  readonly searchField = signal<AdminLibreriaSearchField>('name');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.loadLibrerias();
  }

  loadLibrerias(selectedId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.service
      .getAdminLibrerias({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.search(),
        searchField: this.searchField(),
        includeDeleted: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.librerias.set(result.data);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));

          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadLibrerias(selectedId);
            return;
          }

          const currentId = selectedId ?? this.selectedLibreria()?._id;
          if (currentId) {
            const refreshed = result.data.find((item) => item._id === currentId);
            if (refreshed) this.selectedLibreria.set(this.mapToForm(refreshed));
            this.isCreating.set(false);
            return;
          }

          this.selectedLibreria.set(null);
          this.isCreating.set(false);
        },
        error: (error) => this.showError(error, 'No se pudieron cargar las librerías.'),
      });
  }

  onListQuery(query: AdminListQuery): void {
    this.search.set(query.search);
    this.searchField.set(query.searchField as AdminLibreriaSearchField);
    this.currentPage.set(query.page);
    this.pageSize.set(query.pageSize);
    this.loadLibrerias();
  }

  onCreateNew(): void {
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedLibreria.set(this.createEmpty());
  }

  onSelect(libreria: Libreria): void {
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedLibreria.set(this.mapToForm(libreria));
  }

  onSave(libreria: Libreria): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    const creating = this.isCreating() || !libreria._id;
    const payload = {
      name: libreria.name.trim(),
      address: libreria.address.trim(),
      IsDeleted: libreria.IsDeleted ?? false,
    };
    const request = creating
      ? this.service.createLibreria(payload)
      : this.service.updateLibreria(libreria._id as string, payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        this.isCreating.set(false);
        this.selectedLibreria.set(this.mapToForm(saved));
        this.showSuccess(
          creating ? 'Librería creada correctamente.' : 'Librería actualizada correctamente.',
        );
        this.loadLibrerias(saved._id);
      },
      error: (error) => this.showError(error, 'No se pudo guardar la librería.'),
    });
  }

  onDelete(libreria: Libreria): void {
    if (!libreria._id || !window.confirm(`¿Desactivar la librería "${libreria.name}"?`)) return;
    this.isDeleting.set(true);
    this.service
      .softDeleteLibreria(libreria._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedLibreria.set(this.mapToForm(updated));
          this.showSuccess('Librería desactivada correctamente.');
          this.loadLibrerias(updated._id);
        },
        error: (error) => this.showError(error, 'No se pudo desactivar la librería.'),
      });
  }

  onRestore(libreria: Libreria): void {
    if (!libreria._id) return;
    this.isDeleting.set(true);
    this.service
      .restoreLibreria(libreria._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedLibreria.set(this.mapToForm(updated));
          this.showSuccess('Librería restaurada correctamente.');
          this.loadLibrerias(updated._id);
        },
        error: (error) => this.showError(error, 'No se pudo restaurar la librería.'),
      });
  }

  onPermanentDelete(libreria: Libreria): void {
    if (
      !libreria._id ||
      !window.confirm(
        `¿Eliminar definitivamente la librería "${libreria.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.service
      .permanentDeleteLibreria(libreria._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          if (this.selectedLibreria()?._id === libreria._id) {
            this.selectedLibreria.set(null);
          }
          this.showSuccess('Librería eliminada definitivamente.');
          this.loadLibrerias();
        },
        error: (error) => this.showError(error, 'No se pudo eliminar definitivamente la librería.'),
      });
  }

  onCancel(): void {
    this.selectedLibreria.set(null);
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private createEmpty(): Libreria {
    return { name: '', address: '', IsDeleted: false };
  }

  private mapToForm(libreria: Libreria): Libreria {
    return {
      ...libreria,
      name: libreria.name ?? '',
      address: libreria.address ?? '',
      IsDeleted: libreria.IsDeleted ?? false,
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
