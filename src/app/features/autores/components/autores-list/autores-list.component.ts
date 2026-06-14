import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Autor } from '../../../../Core/models/autor.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-autores-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './autores-list.component.html',
  styleUrl: './autores-list.component.css',
})
export class AutoresListComponent {
  @Input() autores: Autor[] = [];
  @Input() selectedAutorId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 8;
  @Input() isAdmin = false;

  @Output() selectAutor = new EventEmitter<Autor>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Autor>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'fullName', label: 'Nombre completo' },
    { value: '_id', label: 'ID de MongoDB' },
  ];

  onSelect(autor: Autor): void {
    this.selectAutor.emit(autor);
  }

  onPermanentDelete(event: MouseEvent, autor: Autor): void {
    event.stopPropagation();
    this.permanentDelete.emit(autor);
  }

  onRowKeydown(event: KeyboardEvent, autor: Autor): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(autor);
  }

  isSelected(autor: Autor): boolean {
    return !!autor._id && autor._id === this.selectedAutorId;
  }

  trackByAutorId(index: number, autor: Autor): string | number {
    return autor._id ?? index;
  }
}
