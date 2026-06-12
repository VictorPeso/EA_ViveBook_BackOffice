import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Libreria } from '../../../../Core/models/libreria.model';
import { LibreriasService } from '../../../../Core/services/librerias.service';
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
  private readonly platformId = inject(PLATFORM_ID);

  readonly librerias = signal<Libreria[]>([]);
  readonly selectedLibreria = signal<Libreria | null>(null);
  readonly isLoading = signal(false);
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

          this.selectedLibreria.set(this.createEmpty());
          this.isCreating.set(true);
        },
        error: () => this.errorMessage.set('No se pudieron cargar las librerías.'),
      });
  }

  onSearch(term: string): void {
    this.search.set(term.trim());
    this.currentPage.set(1);
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
        this.successMessage.set(
          creating ? 'Librería creada correctamente.' : 'Librería actualizada correctamente.',
        );
        this.loadLibrerias(saved._id);
      },
      error: (error) =>
        this.errorMessage.set(error?.error?.message || 'No se pudo guardar la librería.'),
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
          this.successMessage.set('Librería desactivada correctamente.');
          this.loadLibrerias(updated._id);
        },
        error: () => this.errorMessage.set('No se pudo desactivar la librería.'),
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
          this.successMessage.set('Librería restaurada correctamente.');
          this.loadLibrerias(updated._id);
        },
        error: () => this.errorMessage.set('No se pudo restaurar la librería.'),
      });
  }

  onCancel(): void {
    this.selectedLibreria.set(this.createEmpty());
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadLibrerias();
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
}
