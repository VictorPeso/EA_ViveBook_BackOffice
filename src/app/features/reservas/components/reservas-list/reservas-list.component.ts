import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Libro } from '../../../../Core/models/libro.model';
import { Reserva } from '../../../../Core/models/reserva.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-reservas-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './reservas-list.component.html',
  styleUrl: './reservas-list.component.css',
})
export class ReservasListComponent {
  @Input() reservas: Reserva[] = [];
  @Input() selectedId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 5;
  @Input() isAdmin = true;

  @Output() selectReserva = new EventEmitter<Reserva>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Reserva>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'user', label: 'Usuario' },
    { value: 'book', label: 'Libro' },
    { value: 'date', label: 'Fecha' },
    { value: 'status', label: 'Estado' },
    { value: '_id', label: 'ID de MongoDB' },
  ];

  user(value: string | Usuario): string {
    if (typeof value === 'string') return value;
    return value.name || value.email || value._id || '-';
  }

  book(value: string | Libro): string {
    if (typeof value === 'string') return value;
    return value.title || value.isbn || value._id || '-';
  }

  onSelect(reserva: Reserva): void {
    this.selectReserva.emit(reserva);
  }

  onPermanentDelete(event: MouseEvent, reserva: Reserva): void {
    event.stopPropagation();
    this.permanentDelete.emit(reserva);
  }

  onRowKeydown(event: KeyboardEvent, reserva: Reserva): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(reserva);
  }

  trackByReservaId(index: number, reserva: Reserva): string | number {
    return reserva._id ?? index;
  }
}
