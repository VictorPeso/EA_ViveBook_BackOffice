import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Usuario } from '../../../../Core/models/usuario.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css',
})
export class UsuarioFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() usuario: Usuario | null = null;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = false;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<any>();
  @Output() delete = new EventEmitter<Usuario>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    confirmPassword: [''],
  }, { validators: this.passwordsMatchValidator });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario']) {
      this.patchForm(this.usuario);
    }
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload = {
      _id: rawValue._id || undefined,
      name: rawValue.name.trim(),
      email: rawValue.email.trim(),
      password: rawValue.password || undefined
    };

    this.save.emit(payload);
  }

  onDelete(): void {
    if (this.usuario) this.delete.emit(this.usuario);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get nameControl() { return this.form.controls.name; }
  get emailControl() { return this.form.controls.email; }
  get hasUsuario(): boolean { return !!this.usuario || this.isCreating; }
  get formTitle(): string { return this.isCreating ? 'Nuevo usuario' : 'Detalle del usuario'; }
  get formSubtitle(): string {
    return this.isCreating ? 'Completa los datos para el nuevo usuario.' : 'Consulta o edita los datos del perfil.';
  }

  private patchForm(usuario: Usuario | null): void {
    this.form.reset({
      _id: usuario?._id ?? '',
      name: usuario?.name ?? '',
      email: usuario?.email ?? '',
      password: '',
      confirmPassword: '',
    });
  }
}