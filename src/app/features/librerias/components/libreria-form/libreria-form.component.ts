import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Libreria } from '../../../../Core/models/libreria.model';

@Component({
  selector: 'app-libreria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './libreria-form.component.html',
  styleUrl: './libreria-form.component.css',
})
export class LibreriaFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() libreria: Libreria | null = null;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';
  @Output() save = new EventEmitter<Libreria>();
  @Output() delete = new EventEmitter<Libreria>();
  @Output() restore = new EventEmitter<Libreria>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    address: ['', [Validators.required, Validators.maxLength(300)]],
    IsDeleted: [false],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['libreria']) {
      this.form.reset({
        _id: this.libreria?._id ?? '',
        name: this.libreria?.name ?? '',
        address: this.libreria?.address ?? '',
        IsDeleted: this.libreria?.IsDeleted ?? false,
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.currentValue());
  }

  onDelete(): void {
    const value = this.currentValue();
    if (value._id) this.delete.emit(value);
  }

  onRestore(): void {
    const value = this.currentValue();
    if (value._id) this.restore.emit(value);
  }

  private currentValue(): Libreria {
    const value = this.form.getRawValue();
    return {
      _id: value._id || undefined,
      name: value.name.trim(),
      address: value.address.trim(),
      IsDeleted: value.IsDeleted,
    };
  }
}
