import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Reto } from '../../../../Core/models/reto.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-retos-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './retos-list.component.html',
  styleUrl: './retos-list.component.css',
})
export class RetosListComponent {
  @Input() retos: Reto[] = [];
  @Input() selectedId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 5;
  @Input() isAdmin = true;

  @Output() selectReto = new EventEmitter<Reto>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Reto>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'title', label: 'Nombre' },
    { value: 'type', label: 'Tipo' },
    { value: 'objective', label: 'Objetivo' },
    { value: 'date', label: 'Fecha' },
    { value: '_id', label: 'ID de MongoDB' },
  ];

  typeLabel(type: Reto['type']): string {
    return type.replaceAll('_', ' ').toLowerCase();
  }

  onSelect(reto: Reto): void {
    this.selectReto.emit(reto);
  }

  onPermanentDelete(event: MouseEvent, reto: Reto): void {
    event.stopPropagation();
    this.permanentDelete.emit(reto);
  }

  onRowKeydown(event: KeyboardEvent, reto: Reto): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(reto);
  }

  trackByRetoId(index: number, reto: Reto): string | number {
    return reto._id ?? index;
  }
}
