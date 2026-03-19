import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Usuario } from '../../../../Core/models/usuario.model';
import { UsuarioService } from '../../../../Core/services/usuario.service';
import { UsuarioFormComponent } from '../../compoonents/usuario-form/usuario-form.component';
import { UsuariosListComponent } from '../../compoonents/usuarios-list/usuarios-list.component';
import { ConfirmDialogComponent } from '../../../../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, UsuariosListComponent, UsuarioFormComponent],
  templateUrl: './usuarios-page.component.html',
  styleUrl: './usuarios-page.component.css',
})
export class UsuariosPageComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);

  usuarios: Usuario[] = [];
  selectedUsuario: Usuario | null = null;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isCreating = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(selectedId?: string): void {
    this.isLoading = true;
    this.usuarioService.getUsuarios()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.usuarios = data ?? [];
          if (selectedId) {
            this.selectedUsuario = this.usuarios.find(u => u._id === selectedId) ?? null;
            this.isCreating = false;
          } else if (!this.isCreating && this.usuarios.length > 0) {
            this.onSelectUsuario(this.usuarios[0]);
          }
        },
        error: () => this.errorMessage = 'No se pudieron cargar los usuarios.'
      });
  }

  onSelectUsuario(usuario: Usuario): void {
    this.isCreating = false;
    this.selectedUsuario = { ...usuario };
    // Cargar libros del usuario al seleccionar
    this.usuarioService.getUsuarioLibros(usuario._id).subscribe(libros => {
      if (this.selectedUsuario) this.selectedUsuario.libro = libros;
    });
  }

  onCreateNew(): void {
    this.isCreating = true;
    this.selectedUsuario = { name: '', email: '', libro: [] } as any;
  }

  onSaveUsuario(data: any): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Preparamos el objeto tal cual lo espera el servicio (sin el campo vacío de organización)
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password
    };

    const request = (this.isCreating || !data._id) 
      ? this.usuarioService.createUsuario(payload) 
      : this.usuarioService.updateUsuario(data._id, payload);

    request.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (res) => {
        this.successMessage = this.isCreating ? 'Usuario creado con éxito' : 'Usuario actualizado';
        this.loadUsuarios(res._id);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error al procesar la solicitud.';
      }
    });
  }

  onDeleteUsuario(usuario: Usuario): void {
    if (!window.confirm(`¿Borrar a ${usuario.name}?`)) return;
    this.isDeleting = true;
    this.usuarioService.deleteUsuario(usuario._id)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: () => {
          this.successMessage = 'Usuario eliminado.';
          this.loadUsuarios();
        }
      });
  }

  onCancelForm(): void {
    this.isCreating = false;
    if (this.usuarios.length > 0) this.onSelectUsuario(this.usuarios[0]);
  }
}