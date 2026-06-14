import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Libreria } from '../../../../Core/models/libreria.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-librerias-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './librerias-list.component.html',
  styleUrl: './librerias-list.component.css',
})
export class LibreriasListComponent {
  @Input() librerias: Libreria[] = [];
  @Input() selectedId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 5;
  @Input() isAdmin = true;

  @Output() selectLibreria = new EventEmitter<Libreria>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Libreria>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'name', label: 'Nombre' },
    { value: 'address', label: 'Dirección' },
    { value: '_id', label: 'ID de MongoDB' },
  ];

  onSelect(libreria: Libreria): void {
    this.selectLibreria.emit(libreria);
  }

  onPermanentDelete(event: MouseEvent, libreria: Libreria): void {
    event.stopPropagation();
    this.permanentDelete.emit(libreria);
  }

  onRowKeydown(event: KeyboardEvent, libreria: Libreria): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(libreria);
  }

  trackByLibreriaId(index: number, libreria: Libreria): string | number {
    return libreria._id ?? index;
  }
}
