import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css',
})
export class UsuariosListComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() selectedUsuarioId: string | null = null;
  @Input() isLoading = false;
  @Input() isAdmin = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 8;

  @Output() selectUsuario = new EventEmitter<Usuario>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Usuario>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'name', label: 'Nombre' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Rol' },
    { value: '_id', label: 'ID de MongoDB' },
  ];

  onSelect(usuario: Usuario): void {
    this.selectUsuario.emit(usuario);
  }

  onPermanentDelete(event: MouseEvent, usuario: Usuario): void {
    event.stopPropagation();
    this.permanentDelete.emit(usuario);
  }

  onRowKeydown(event: KeyboardEvent, usuario: Usuario): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(usuario);
  }

  isSelected(usuario: Usuario): boolean {
    return !!usuario._id && usuario._id === this.selectedUsuarioId;
  }

  trackByUsuarioId(index: number, usuario: Usuario): string | number {
    return usuario._id ?? index;
  }
}
