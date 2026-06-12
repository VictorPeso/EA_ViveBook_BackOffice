import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Libro } from '../../../../Core/models/libro.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { LibrosService } from '../../../../Core/services/libros.service';
import { UsuariosService } from '../../../../Core/services/usuarios.service';
import { UsuarioFormComponent } from '../../components/usuario-form/usuario-form.component';
import { UsuariosListComponent } from '../../components/usuarios-list/usuarios-list.component';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, UsuarioFormComponent, UsuariosListComponent],
  templateUrl: './usuarios-page.component.html',
  styleUrl: './usuarios-page.component.css',
})
export class UsuariosPageComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly librosService = inject(LibrosService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly usuarios = signal<Usuario[]>([]);
  readonly libros = signal<Libro[]>([]);
  readonly selectedUsuario = signal<Usuario | null>(null);
  readonly isLoading = signal(false);
  readonly isLoadingLibros = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(true);
  readonly isAdmin = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly searchUsuario = signal('');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadLibros();
      this.loadUsuarios();
    }
  }

  onSearch(term: string): void {
    this.searchUsuario.set(term.trim());
    this.currentPage.set(1);
    this.loadUsuarios();
  }

  loadUsuarios(selectedUsuarioId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.usuariosService
      .getAdminUsuarios({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchUsuario(),
        includeDeleted: true,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.usuarios.set(result.data);
          this.totalItems.set(result.pagination.total);
          this.totalPages.set(Math.max(result.pagination.totalPages, 1));

          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
            this.loadUsuarios(selectedUsuarioId);
            return;
          }

          const selectedId = selectedUsuarioId ?? this.selectedUsuario()?._id;
          if (selectedId) {
            const refreshed = result.data.find((usuario) => usuario._id === selectedId);
            if (refreshed) this.selectedUsuario.set(this.mapUsuarioToFormValue(refreshed));
            this.isCreating.set(false);
            return;
          }

          this.selectedUsuario.set(this.createEmptyUsuario());
          this.isCreating.set(true);
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.errorMessage.set('No se pudieron cargar los usuarios.');
        },
      });
  }

  loadLibros(): void {
    this.isLoadingLibros.set(true);
    this.librosService
      .getAdminLibros({ page: 1, limit: 100, includeDeleted: false })
      .pipe(finalize(() => this.isLoadingLibros.set(false)))
      .subscribe({
        next: (result) => this.libros.set(result.data),
        error: () => this.errorMessage.set('No se pudieron cargar los libros.'),
      });
  }

  onCreateNew(): void {
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedUsuario.set(this.createEmptyUsuario());
  }

  onSelectUsuario(usuario: Usuario): void {
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedUsuario.set(this.mapUsuarioToFormValue(usuario));
  }

  onSaveUsuario(usuarioData: Usuario): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const creating = this.isCreating() || !usuarioData._id;
    const request = creating
      ? this.usuariosService.createUsuario(this.buildCreateUsuarioPayload(usuarioData))
      : this.usuariosService.updateUsuario(
          usuarioData._id as string,
          this.buildUpdateUsuarioPayload(usuarioData),
        );

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (savedUsuario) => {
        this.isCreating.set(false);
        this.selectedUsuario.set(this.mapUsuarioToFormValue(savedUsuario));
        this.successMessage.set(
          creating ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.',
        );
        this.loadUsuarios(savedUsuario._id);
      },
      error: (error) => {
        console.error('Error al guardar usuario:', error);
        this.errorMessage.set(
          error?.error?.message ||
            error?.error?.details?.[0]?.message ||
            'No se pudo guardar el usuario.',
        );
      },
    });
  }

  onDeleteUsuario(usuario: Usuario): void {
    if (!usuario._id || !window.confirm(`¿Desactivar al usuario "${usuario.name}"?`)) return;

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.usuariosService
      .softDeleteUsuario(usuario._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updatedUsuario) => {
          this.selectedUsuario.set(this.mapUsuarioToFormValue(updatedUsuario));
          this.successMessage.set('Usuario desactivado correctamente.');
          this.loadUsuarios(updatedUsuario._id);
        },
        error: () => this.errorMessage.set('No se pudo desactivar el usuario.'),
      });
  }

  onRestore(usuario: Usuario): void {
    if (!usuario._id) return;

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.usuariosService
      .restoreUsuario(usuario._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updatedUsuario) => {
          this.selectedUsuario.set(this.mapUsuarioToFormValue(updatedUsuario));
          this.successMessage.set('Usuario restaurado correctamente.');
          this.loadUsuarios(updatedUsuario._id);
        },
        error: () => this.errorMessage.set('No se pudo restaurar el usuario.'),
      });
  }

  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedUsuario.set(this.createEmptyUsuario());
    this.isCreating.set(true);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadUsuarios();
  }

  onNextPage(): void {
    this.onPageChange(this.currentPage() + 1);
  }

  onPreviousPage(): void {
    this.onPageChange(this.currentPage() - 1);
  }

  private createEmptyUsuario(): Usuario {
    return {
      name: '',
      email: '',
      password: '',
      rol: 'User',
      libros: [],
      avatar: '',
      description: '',
      IsDeleted: false,
      hasSeenTutorial: false,
    };
  }

  private mapUsuarioToFormValue(usuario: Usuario): Usuario {
    return {
      ...usuario,
      name: usuario.name ?? '',
      email: usuario.email ?? '',
      password: '',
      rol: usuario.rol ?? 'User',
      libros: this.extractLibroIds(usuario.libros),
      avatar: usuario.avatar ?? '',
      description: usuario.description ?? '',
      IsDeleted: usuario.IsDeleted ?? false,
      hasSeenTutorial: usuario.hasSeenTutorial ?? false,
    };
  }

  private buildCreateUsuarioPayload(usuario: Usuario): Usuario {
    return {
      ...this.buildCommonPayload(usuario),
      password: usuario.password ?? '',
    } as Usuario;
  }

  private buildUpdateUsuarioPayload(usuario: Usuario): Partial<Usuario> {
    const payload = this.buildCommonPayload(usuario);
    if (usuario.password?.trim()) payload.password = usuario.password;
    return payload;
  }

  private buildCommonPayload(usuario: Usuario): Partial<Usuario> {
    return {
      name: usuario.name.trim(),
      email: usuario.email.trim(),
      rol: usuario.rol,
      libros: this.extractLibroIds(usuario.libros),
      avatar: usuario.avatar?.trim() ?? '',
      description: usuario.description?.trim() ?? '',
      IsDeleted: usuario.IsDeleted ?? false,
      hasSeenTutorial: usuario.hasSeenTutorial ?? false,
    };
  }

  private extractLibroIds(libros: Usuario['libros']): string[] {
    return Array.isArray(libros)
      ? libros
          .map((libro) => (typeof libro === 'string' ? libro : libro._id))
          .filter((id): id is string => !!id)
      : [];
  }
}
