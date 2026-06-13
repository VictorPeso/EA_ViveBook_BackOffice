import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Evento } from '../../../../Core/models/evento.model';
import { getApiErrorMessage } from '../../../../Core/models/api-response.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { EventosService } from '../../../../Core/services/eventos.service';
import { UsuariosService } from '../../../../Core/services/usuarios.service';
import { EventoFormComponent } from '../../components/evento-form/evento-form.component';
import { EventosListComponent } from '../../components/eventos-list/eventos-list.component';

@Component({
  selector: 'app-eventos-page',
  standalone: true,
  imports: [CommonModule, EventoFormComponent, EventosListComponent],
  templateUrl: './eventos-page.component.html',
  styleUrl: './eventos-page.component.css',
})
export class EventosPageComponent implements OnInit {
  private readonly eventosService = inject(EventosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly eventos = signal<Evento[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly selectedEvento = signal<Evento | null>(null);
  readonly isLoading = signal(false);
  readonly isLoadingUsuarios = signal(false);
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

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUsuarios();
      this.loadEventos();
    }
  }

  loadEventos(selectedId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.eventosService
      .getAdminEventos({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.search(),
        includeDeleted: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.eventos.set(result.data);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));
          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadEventos(selectedId);
            return;
          }
          const currentId = selectedId ?? this.selectedEvento()?._id;
          if (currentId) {
            const refreshed = result.data.find((evento) => evento._id === currentId);
            if (refreshed) this.selectedEvento.set(this.mapToForm(refreshed));
            this.isCreating.set(false);
            return;
          }
          this.selectedEvento.set(null);
          this.isCreating.set(false);
        },
        error: (error) =>
          this.errorMessage.set(getApiErrorMessage(error, 'No se pudieron cargar los eventos.')),
      });
  }

  loadUsuarios(): void {
    this.isLoadingUsuarios.set(true);
    this.usuariosService
      .getAdminUsuarios({ page: 1, limit: 100, includeDeleted: false })
      .pipe(finalize(() => this.isLoadingUsuarios.set(false)))
      .subscribe({
        next: (result) => this.usuarios.set(result.data),
        error: (error) =>
          this.errorMessage.set(getApiErrorMessage(error, 'No se pudieron cargar los usuarios.')),
      });
  }

  onSearch(term: string): void {
    this.search.set(term.trim());
    this.currentPage.set(1);
    this.loadEventos();
  }

  onCreateNew(): void {
    this.selectedEvento.set(this.createEmpty());
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSelect(evento: Evento): void {
    this.selectedEvento.set(this.mapToForm(evento));
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSave(evento: Evento): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    const creating = this.isCreating() || !evento._id;
    const payload = this.buildPayload(evento);
    const request = creating
      ? this.eventosService.createEvento(payload as Evento)
      : this.eventosService.updateEvento(evento._id as string, payload);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        this.selectedEvento.set(this.mapToForm(saved));
        this.isCreating.set(false);
        this.successMessage.set(
          creating ? 'Evento creado correctamente.' : 'Evento actualizado correctamente.',
        );
        this.loadEventos(saved._id);
      },
      error: (error) =>
        this.errorMessage.set(getApiErrorMessage(error, 'No se pudo guardar el evento.')),
    });
  }

  onDelete(evento: Evento): void {
    if (!evento._id || !window.confirm(`¿Desactivar el evento "${evento.title}"?`)) return;
    this.isDeleting.set(true);
    this.eventosService
      .softDeleteEvento(evento._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedEvento.set(this.mapToForm(updated));
          this.successMessage.set('Evento desactivado correctamente.');
          this.loadEventos(updated._id);
        },
        error: (error) =>
          this.errorMessage.set(getApiErrorMessage(error, 'No se pudo desactivar el evento.')),
      });
  }

  onRestore(evento: Evento): void {
    if (!evento._id) return;
    this.isDeleting.set(true);
    this.eventosService
      .restoreEvento(evento._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedEvento.set(this.mapToForm(updated));
          this.successMessage.set('Evento restaurado correctamente.');
          this.loadEventos(updated._id);
        },
        error: (error) =>
          this.errorMessage.set(getApiErrorMessage(error, 'No se pudo restaurar el evento.')),
      });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadEventos();
  }

  onCancel(): void {
    this.selectedEvento.set(null);
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private createEmpty(): Evento {
    return {
      title: '',
      description: '',
      creator: '',
      participant: [],
      eventDate: '',
      location: { type: 'Point', coordinates: [0, 0] },
      direccionExacta: '',
      IsDeleted: false,
    };
  }

  private mapToForm(evento: Evento): Evento {
    return {
      ...evento,
      IsDeleted: evento.IsDeleted ?? false,
    };
  }

  private buildPayload(evento: Evento): Partial<Evento> {
    return {
      title: evento.title.trim(),
      description: evento.description.trim(),
      creator: this.userId(evento.creator),
      participant: evento.participant.map((user) => this.userId(user)),
      eventDate: evento.eventDate,
      location: {
        type: 'Point',
        coordinates: [
          Number(evento.location.coordinates[0]),
          Number(evento.location.coordinates[1]),
        ],
      },
      direccionExacta: evento.direccionExacta.trim(),
      IsDeleted: evento.IsDeleted ?? false,
    };
  }

  private userId(user: string | Usuario): string {
    return typeof user === 'string' ? user : (user._id ?? '');
  }
}
