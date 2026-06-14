import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Libro } from '../../../../Core/models/libro.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { Valoracion } from '../../../../Core/models/valoracion.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-valoraciones-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './valoraciones-list.component.html',
  styleUrl: './valoraciones-list.component.css',
})
export class ValoracionesListComponent {
  @Input() valoraciones: Valoracion[] = [];
  @Input() selectedId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 5;
  @Input() isAdmin = true;

  @Output() selectValoracion = new EventEmitter<Valoracion>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Valoracion>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'user', label: 'Usuario' },
    { value: 'book', label: 'Libro' },
    { value: 'rating', label: 'Puntuación' },
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

  onSelect(valoracion: Valoracion): void {
    this.selectValoracion.emit(valoracion);
  }

  onPermanentDelete(event: MouseEvent, valoracion: Valoracion): void {
    event.stopPropagation();
    this.permanentDelete.emit(valoracion);
  }

  onRowKeydown(event: KeyboardEvent, valoracion: Valoracion): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(valoracion);
  }

  trackByValoracionId(index: number, valoracion: Valoracion): string | number {
    return valoracion._id ?? index;
  }
}
