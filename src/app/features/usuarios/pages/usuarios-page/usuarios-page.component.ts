import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AdminListQuery } from '../../../../Core/models/admin-list.model';
import { getApiErrorMessage } from '../../../../Core/models/api-response.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import {
  AdminUsuarioSearchField,
  UsuariosService,
} from '../../../../Core/services/usuarios.service';
import { ToastService } from '../../../../Core/services/toast.service';
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
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly usuarios = signal<Usuario[]>([]);
  readonly selectedUsuario = signal<Usuario | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(false);
  readonly isAdmin = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly searchUsuario = signal('');
  readonly searchField = signal<AdminUsuarioSearchField>('name');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUsuarios();
    }
  }

  onListQuery(query: AdminListQuery): void {
    this.searchUsuario.set(query.search);
    this.searchField.set(query.searchField as AdminUsuarioSearchField);
    this.currentPage.set(query.page);
    this.pageSize.set(query.pageSize);
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
        searchField: this.searchField(),
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

          this.selectedUsuario.set(null);
          this.isCreating.set(false);
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.showError(error, 'No se pudieron cargar los usuarios.');
        },
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
        this.showSuccess(
          creating ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.',
        );
        this.loadUsuarios(savedUsuario._id);
      },
      error: (error) => {
        console.error('Error al guardar usuario:', error);
        this.showError(error, 'No se pudo guardar el usuario.');
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
          this.showSuccess('Usuario desactivado correctamente.');
          this.loadUsuarios(updatedUsuario._id);
        },
        error: (error) => this.showError(error, 'No se pudo desactivar el usuario.'),
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
          this.showSuccess('Usuario restaurado correctamente.');
          this.loadUsuarios(updatedUsuario._id);
        },
        error: (error) => this.showError(error, 'No se pudo restaurar el usuario.'),
      });
  }

  onPermanentDelete(usuario: Usuario): void {
    if (
      !usuario._id ||
      !window.confirm(
        `¿Eliminar definitivamente al usuario "${usuario.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usuariosService
      .permanentDeleteUsuario(usuario._id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          if (this.selectedUsuario()?._id === usuario._id) {
            this.selectedUsuario.set(null);
          }
          this.showSuccess('Usuario eliminado definitivamente.');
          this.loadUsuarios();
        },
        error: (error) => this.showError(error, 'No se pudo eliminar definitivamente el usuario.'),
      });
  }

  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedUsuario.set(null);
    this.isCreating.set(false);
  }

  private createEmptyUsuario(): Usuario {
    return {
      name: '',
      email: '',
      password: '',
      rol: 'User',
      libros: [],
      boughtLibros: [],
      rentedLibros: [],
      favoriteAuthors: [],
      favoriteBooks: [],
      favoriteCategories: [],
      wishlist: [],
      followingUsers: [],
      favoritos: [],
      notificationUsersEnabled: [],
      authProvider: 'local',
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
      libros: usuario.libros ?? [],
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
      boughtLibros: this.extractLibroIds(usuario.boughtLibros),
      rentedLibros: this.extractLibroIds(usuario.rentedLibros),
      favoriteAuthors: usuario.favoriteAuthors ?? [],
      favoriteBooks: this.extractLibroIds(usuario.favoriteBooks),
      favoriteCategories: usuario.favoriteCategories ?? [],
      wishlist: this.extractLibroIds(usuario.wishlist),
      followingUsers: this.extractReferenceIds(usuario.followingUsers),
      favoritos: this.extractLibroIds(usuario.favoritos),
      notificationUsersEnabled: this.extractReferenceIds(usuario.notificationUsersEnabled),
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

  private extractReferenceIds(
    references: Usuario['followingUsers'] | Usuario['notificationUsersEnabled'],
  ): string[] {
    return Array.isArray(references)
      ? references
          .map((reference) => (typeof reference === 'string' ? reference : reference._id))
          .filter((id): id is string => !!id)
      : [];
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.toastService.success(message);
  }

  private showError(error: unknown, fallbackMessage: string): void {
    const message = getApiErrorMessage(error, fallbackMessage);
    this.errorMessage.set(message);
    this.toastService.error(message);
  }
}
