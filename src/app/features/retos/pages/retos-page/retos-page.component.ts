import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Reto } from '../../../../Core/models/reto.model';
import { RetosService } from '../../../../Core/services/retos.service';
import { RetoFormComponent } from '../../components/reto-form/reto-form.component';
import { RetosListComponent } from '../../components/retos-list/retos-list.component';

@Component({
  selector: 'app-retos-page',
  standalone: true,
  imports: [CommonModule, RetoFormComponent, RetosListComponent],
  templateUrl: './retos-page.component.html',
  styleUrl: './retos-page.component.css',
})
export class RetosPageComponent implements OnInit {
  private readonly service = inject(RetosService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly retos = signal<Reto[]>([]);
  readonly selected = signal<Reto | null>(null);
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
    if (isPlatformBrowser(this.platformId)) this.loadRetos();
  }

  loadRetos(selectedId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.service
      .getAdminRetos({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.search(),
        includeInactive: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.retos.set(result.data);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));
          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadRetos(selectedId);
            return;
          }
          const currentId = selectedId ?? this.selected()?._id;
          if (currentId) {
            const refreshed = result.data.find((item) => item._id === currentId);
            if (refreshed) this.selected.set(refreshed);
            this.isCreating.set(false);
            return;
          }
          this.selected.set(this.createEmpty());
          this.isCreating.set(true);
        },
        error: () => this.errorMessage.set('No se pudieron cargar los retos.'),
      });
  }

  onSearch(term: string): void {
    this.search.set(term.trim());
    this.currentPage.set(1);
    this.loadRetos();
  }

  onCreateNew(): void {
    this.selected.set(this.createEmpty());
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSelect(reto: Reto): void {
    this.selected.set({ ...reto });
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSave(reto: Reto): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    const creating = this.isCreating() || !reto._id;
    const payload = this.buildPayload(reto);
    const request = creating
      ? this.service.createReto(payload as Reto)
      : this.service.updateReto(reto._id as string, payload);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        this.selected.set(saved);
        this.isCreating.set(false);
        this.successMessage.set(
          creating ? 'Reto creado correctamente.' : 'Reto actualizado correctamente.',
        );
        this.loadRetos(saved._id);
      },
      error: (error) =>
        this.errorMessage.set(error?.error?.message || 'No se pudo guardar el reto.'),
    });
  }

  onDeactivate(reto: Reto): void {
    if (!reto._id || !window.confirm('¿Desactivar este reto?')) return;
    this.isDeleting.set(true);
    this.service
      .deactivateReto(reto._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selected.set(updated);
          this.successMessage.set('Reto desactivado correctamente.');
          this.loadRetos(updated._id);
        },
        error: () => this.errorMessage.set('No se pudo desactivar el reto.'),
      });
  }

  onActivate(reto: Reto): void {
    if (!reto._id) return;
    this.isDeleting.set(true);
    this.service
      .activateReto(reto._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selected.set(updated);
          this.successMessage.set('Reto activado correctamente.');
          this.loadRetos(updated._id);
        },
        error: () => this.errorMessage.set('No se pudo activar el reto.'),
      });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadRetos();
  }

  onCancel(): void {
    this.selected.set(this.createEmpty());
    this.isCreating.set(true);
  }

  private createEmpty(): Reto {
    return {
      title: '',
      description: '',
      type: 'COMPRAR_LIBROS',
      objetivo: 1,
      activo: true,
    };
  }

  private buildPayload(reto: Reto): Partial<Reto> {
    return {
      title: reto.title.trim(),
      description: reto.description.trim(),
      type: reto.type,
      objetivo: Number(reto.objetivo),
      activo: reto.activo ?? true,
    };
  }
}
