import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Usuario } from '../../../../Core/models/usuario.model';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css',
})
export class UsuariosListComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() selectedUsuarioId: string | null = null;
  @Input() isLoading = false;

  @Output() selectUsuario = new EventEmitter<Usuario>();
  @Output() createNew = new EventEmitter<void>();

  onSelect(usuario: Usuario): void {
    this.selectUsuario.emit(usuario);
  }

  onCreateNew(): void {
    this.createNew.emit();
  }

  trackByUsuarioId(index: number, usuario: Usuario): string | number {
    return usuario._id ?? index;
  }

  getLibrosCount(usuario: Usuario): number {
    return usuario.libro?.length ?? 0;
  }

  isSelected(usuario: Usuario): boolean {
    return !!usuario._id && usuario._id === this.selectedUsuarioId;
  }
}