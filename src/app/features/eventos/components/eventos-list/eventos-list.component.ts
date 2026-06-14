import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Evento } from '../../../../Core/models/evento.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-eventos-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './eventos-list.component.html',
  styleUrl: './eventos-list.component.css',
})
export class EventosListComponent {
  @Input() eventos: Evento[] = [];
  @Input() selectedId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 5;
  @Input() isAdmin = true;

  @Output() selectEvento = new EventEmitter<Evento>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Evento>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'title', label: 'Título' },
    { value: 'eventDate', label: 'Fecha (AAAA-MM-DD)' },
    { value: 'address', label: 'Dirección' },
    { value: '_id', label: 'ID de MongoDB' },
  ];

  onSelect(evento: Evento): void {
    this.selectEvento.emit(evento);
  }

  onPermanentDelete(event: MouseEvent, evento: Evento): void {
    event.stopPropagation();
    this.permanentDelete.emit(evento);
  }

  onRowKeydown(event: KeyboardEvent, evento: Evento): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(evento);
  }

  trackByEventoId(index: number, evento: Evento): string | number {
    return evento._id ?? index;
  }
}
