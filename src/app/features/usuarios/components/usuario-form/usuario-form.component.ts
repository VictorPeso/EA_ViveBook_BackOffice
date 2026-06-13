import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LibroRef, Usuario, UsuarioRef } from '../../../../Core/models/usuario.model';
import {
  AdminEditorComponent,
  AdminEditorSectionDirective,
} from '../../../../shared/components/admin-editor/admin-editor.component';

type BookCollectionName =
  | 'libros'
  | 'boughtLibros'
  | 'rentedLibros'
  | 'favoriteBooks'
  | 'wishlist'
  | 'favoritos';
type UserCollectionName = 'followingUsers' | 'notificationUsersEnabled';
type TextCollectionName = 'favoriteAuthors' | 'favoriteCategories';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminEditorComponent, AdminEditorSectionDirective],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css',
})
export class UsuarioFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() usuario: Usuario | null = null;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<Usuario>();
  @Output() delete = new EventEmitter<Usuario>();
  @Output() cancel = new EventEmitter<void>();
  @Output() restoreUsuario = new EventEmitter<Usuario>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    name: ['', [Validators.maxLength(150)]],
    email: ['', [Validators.email, Validators.maxLength(200)]],
    password: ['', [Validators.maxLength(200)]],
    rol: ['User' as Usuario['rol'], Validators.required],
    avatar: ['', Validators.pattern(/^https?:\/\/.+/i)],
    description: [''],
    hasSeenTutorial: [false],
    IsDeleted: [false],
    libros: this.fb.array<string>([]),
    boughtLibros: this.fb.array<string>([]),
    rentedLibros: this.fb.array<string>([]),
    favoriteAuthors: this.fb.array<string>([]),
    favoriteBooks: this.fb.array<string>([]),
    favoriteCategories: this.fb.array<string>([]),
    wishlist: this.fb.array<string>([]),
    followingUsers: this.fb.array<string>([]),
    favoritos: this.fb.array<string>([]),
    notificationUsersEnabled: this.fb.array<string>([]),
  });

  ngOnInit(): void {
    this.applyModeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario']) {
      this.patchForm(this.usuario);
    }

    if (changes['isCreating']) {
      this.applyModeValidators();
    }
  }

  get nameControl() {
    return this.form.controls.name;
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  get librosControl(): FormArray {
    return this.form.controls.libros;
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo usuario' : 'Editar usuario';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear un nuevo usuario.'
      : 'Modifica los datos del usuario seleccionado.';
  }

  get librosAsociados(): LibroRef[] {
    return this.resolveLibroRefs('libros', this.usuario?.libros);
  }

  get librosComprados(): LibroRef[] {
    return this.resolveLibroRefs('boughtLibros', this.usuario?.boughtLibros);
  }

  get librosAlquilados(): LibroRef[] {
    return this.resolveLibroRefs('rentedLibros', this.usuario?.rentedLibros);
  }

  get librosFavoritos(): LibroRef[] {
    return this.resolveLibroRefs('favoriteBooks', this.usuario?.favoriteBooks);
  }

  get listaDeseos(): LibroRef[] {
    return this.resolveLibroRefs('wishlist', this.usuario?.wishlist);
  }

  get favoritos(): LibroRef[] {
    return this.resolveLibroRefs('favoritos', this.usuario?.favoritos);
  }

  get usuariosSeguidos(): UsuarioRef[] {
    return this.resolveUsuarioRefs('followingUsers', this.usuario?.followingUsers);
  }

  get notificacionesDeUsuarios(): UsuarioRef[] {
    return this.resolveUsuarioRefs(
      'notificationUsersEnabled',
      this.usuario?.notificationUsersEnabled,
    );
  }

  get autoresFavoritos(): string[] {
    return this.getSafeIds(this.form.controls.favoriteAuthors.getRawValue());
  }

  get categoriasFavoritas(): string[] {
    return this.getSafeIds(this.form.controls.favoriteCategories.getRawValue());
  }

  formatDate(value?: string): string {
    if (!value) return 'No disponible';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'No disponible'
      : new Intl.DateTimeFormat('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
  }

  onSubmit(): void {
    this.applyModeValidators();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const libroIds = this.getSafeLibroIds(rawValue.libros);

    const payload: Usuario = {
      _id: rawValue._id || undefined,
      name: rawValue.name.trim(),
      email: rawValue.email.trim(),
      password: rawValue.password,
      rol: rawValue.rol,
      libros: libroIds,
      boughtLibros: this.getSafeIds(rawValue.boughtLibros),
      rentedLibros: this.getSafeIds(rawValue.rentedLibros),
      favoriteAuthors: this.getSafeIds(rawValue.favoriteAuthors),
      favoriteBooks: this.getSafeIds(rawValue.favoriteBooks),
      favoriteCategories: this.getSafeIds(rawValue.favoriteCategories),
      wishlist: this.getSafeIds(rawValue.wishlist),
      followingUsers: this.getSafeIds(rawValue.followingUsers),
      favoritos: this.getSafeIds(rawValue.favoritos),
      notificationUsersEnabled: this.getSafeIds(rawValue.notificationUsersEnabled),
      avatar: rawValue.avatar.trim(),
      description: rawValue.description.trim(),
      hasSeenTutorial: rawValue.hasSeenTutorial,
      IsDeleted: rawValue.IsDeleted ?? false,
    };

    this.save.emit(payload);
  }

  onDelete(): void {
    const currentUsuario = this.buildCurrentUsuarioFromForm();

    if (!currentUsuario || !currentUsuario._id) {
      return;
    }

    this.delete.emit(currentUsuario);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onRestore(event: MouseEvent, usuario: Usuario): void {
    event.stopPropagation();
    this.restoreUsuario.emit(usuario);
  }

  trackByLibroId(index: number, libro: LibroRef): string | number {
    return libro._id ?? index;
  }

  trackByUsuarioId(index: number, usuario: UsuarioRef): string | number {
    return usuario._id ?? index;
  }

  trackByValue(index: number, value: string): string {
    return `${value}-${index}`;
  }

  removeBook(collection: BookCollectionName, libroId: string): void {
    this.removeValue(this.form.controls[collection], libroId);
  }

  removeUser(collection: UserCollectionName, usuarioId: string): void {
    this.removeValue(this.form.controls[collection], usuarioId);

    if (collection === 'followingUsers') {
      this.removeValue(this.form.controls.notificationUsersEnabled, usuarioId);
    }
  }

  removeText(collection: TextCollectionName, value: string): void {
    this.removeValue(this.form.controls[collection], value);
  }

  private applyModeValidators(): void {
    if (this.isCreating) {
      this.nameControl.setValidators([Validators.required, Validators.maxLength(150)]);
      this.emailControl.setValidators([
        Validators.required,
        Validators.email,
        Validators.maxLength(200),
      ]);
      this.passwordControl.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(200),
      ]);
    } else {
      this.nameControl.setValidators([Validators.maxLength(150)]);
      this.emailControl.setValidators([Validators.email, Validators.maxLength(200)]);
      this.passwordControl.setValidators([Validators.minLength(6), Validators.maxLength(200)]);
    }

    this.nameControl.updateValueAndValidity({ emitEvent: false });
    this.emailControl.updateValueAndValidity({ emitEvent: false });
    this.passwordControl.updateValueAndValidity({ emitEvent: false });
  }

  private patchForm(usuario: Usuario | null): void {
    this.form.reset({
      _id: usuario?._id ?? '',
      name: usuario?.name ?? '',
      email: usuario?.email ?? '',
      password: '',
      rol: usuario?.rol ?? 'User',
      avatar: usuario?.avatar ?? '',
      description: usuario?.description ?? '',
      hasSeenTutorial: usuario?.hasSeenTutorial ?? false,
      IsDeleted: usuario?.IsDeleted ?? false,
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
    });

    this.setArrayValues(this.form.controls.libros, this.extractReferenceIds(usuario?.libros));
    this.setArrayValues(
      this.form.controls.boughtLibros,
      this.extractReferenceIds(usuario?.boughtLibros),
    );
    this.setArrayValues(
      this.form.controls.rentedLibros,
      this.extractReferenceIds(usuario?.rentedLibros),
    );
    this.setArrayValues(this.form.controls.favoriteAuthors, usuario?.favoriteAuthors ?? []);
    this.setArrayValues(
      this.form.controls.favoriteBooks,
      this.extractReferenceIds(usuario?.favoriteBooks),
    );
    this.setArrayValues(this.form.controls.favoriteCategories, usuario?.favoriteCategories ?? []);
    this.setArrayValues(this.form.controls.wishlist, this.extractReferenceIds(usuario?.wishlist));
    this.setArrayValues(
      this.form.controls.followingUsers,
      this.extractReferenceIds(usuario?.followingUsers),
    );
    this.setArrayValues(this.form.controls.favoritos, this.extractReferenceIds(usuario?.favoritos));
    this.setArrayValues(
      this.form.controls.notificationUsersEnabled,
      this.extractReferenceIds(usuario?.notificationUsersEnabled),
    );

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.librosControl.updateValueAndValidity();
  }

  private extractReferenceIds(values: Array<string | LibroRef | UsuarioRef> | undefined): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map((value) => (typeof value === 'string' ? value : value._id))
      .filter((id): id is string => !!id);
  }

  private buildCurrentUsuarioFromForm(): Usuario | null {
    const rawValue = this.form.getRawValue();
    const libroIds = this.getSafeLibroIds(rawValue.libros);

    if (!rawValue._id && !rawValue.name.trim() && !rawValue.email.trim()) {
      return null;
    }

    return {
      _id: rawValue._id || undefined,
      name: rawValue.name.trim(),
      email: rawValue.email.trim(),
      password: rawValue.password,
      rol: rawValue.rol,
      libros: libroIds,
      boughtLibros: this.getSafeIds(rawValue.boughtLibros),
      rentedLibros: this.getSafeIds(rawValue.rentedLibros),
      favoriteAuthors: this.getSafeIds(rawValue.favoriteAuthors),
      favoriteBooks: this.getSafeIds(rawValue.favoriteBooks),
      favoriteCategories: this.getSafeIds(rawValue.favoriteCategories),
      wishlist: this.getSafeIds(rawValue.wishlist),
      followingUsers: this.getSafeIds(rawValue.followingUsers),
      favoritos: this.getSafeIds(rawValue.favoritos),
      notificationUsersEnabled: this.getSafeIds(rawValue.notificationUsersEnabled),
      avatar: rawValue.avatar.trim(),
      description: rawValue.description.trim(),
      hasSeenTutorial: rawValue.hasSeenTutorial,
      IsDeleted: rawValue.IsDeleted ?? false,
    };
  }

  private getSafeLibroIds(values: Array<string | null | undefined>): string[] {
    return this.getSafeIds(values);
  }

  private getSafeIds(values: Array<string | null | undefined>): string[] {
    return values
      .map((value) => value?.trim())
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  }

  private resolveLibroRefs(
    collection: BookCollectionName,
    source: Usuario['libros'] | undefined,
  ): LibroRef[] {
    const referenceMap = new Map(
      (source ?? []).map((value) => {
        const reference = typeof value === 'string' ? { _id: value } : value;
        return [reference._id, reference] as const;
      }),
    );
    return this.getSafeIds(this.form.controls[collection].getRawValue()).map(
      (id) => referenceMap.get(id) ?? { _id: id },
    );
  }

  private resolveUsuarioRefs(
    collection: UserCollectionName,
    source: Usuario['followingUsers'] | undefined,
  ): UsuarioRef[] {
    const referenceMap = new Map(
      (source ?? []).map((value) => {
        const reference = typeof value === 'string' ? { _id: value } : value;
        return [reference._id, reference] as const;
      }),
    );
    return this.getSafeIds(this.form.controls[collection].getRawValue()).map(
      (id) => referenceMap.get(id) ?? { _id: id },
    );
  }

  private setArrayValues(control: FormArray, values: string[]): void {
    control.clear();
    values.forEach((value) => control.push(this.fb.control(value, { nonNullable: true })));
  }

  private removeValue(control: FormArray, value: string): void {
    const index = control.getRawValue().indexOf(value);
    if (index < 0) return;
    control.removeAt(index);
    control.markAsDirty();
  }
}
