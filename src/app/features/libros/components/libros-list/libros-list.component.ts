import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Libro } from '../../../../Core/models/libro.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-libros-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './libros-list.component.html',
  styleUrl: './libros-list.component.css',
})
export class LibrosListComponent {
  @Input() libros: Libro[] = [];
  @Input() selectedLibroId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 8;
  @Input() isAdmin = false;

  @Output() selectLibro = new EventEmitter<Libro>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Libro>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'title', label: 'Título' },
    { value: 'isbn', label: 'ISBN' },
    { value: 'author', label: 'Autor' },
    { value: '_id', label: 'ID de MongoDB' },
  ];

  onSelect(libro: Libro): void {
    this.selectLibro.emit(libro);
  }

  onPermanentDelete(event: MouseEvent, libro: Libro): void {
    event.stopPropagation();
    this.permanentDelete.emit(libro);
  }

  onRowKeydown(event: KeyboardEvent, libro: Libro): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(libro);
  }

  isSelected(libro: Libro): boolean {
    return !!libro._id && libro._id === this.selectedLibroId;
  }

  trackByLibroId(index: number, libro: Libro): string | number {
    return libro._id ?? index;
  }

  getAuthorsDisplay(libro: Libro): string {
    if (!Array.isArray(libro.authors) || libro.authors.length === 0) {
      return libro.autor || 'Sin autor';
    }

    return libro.authors
      .map((author) => (typeof author === 'string' ? author : author.fullName || author._id))
      .join(', ');
  }
}
