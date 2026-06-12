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
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Evento } from '../../../../Core/models/evento.model';
import { Usuario } from '../../../../Core/models/usuario.model';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evento-form.component.html',
  styleUrl: './evento-form.component.css',
})
export class EventoFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  @Input() evento: Evento | null = null;
  @Input() usuarios: Usuario[] = [];
  @Input() isLoadingUsuarios = false;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';
  @Output() save = new EventEmitter<Evento>();
  @Output() delete = new EventEmitter<Evento>();
  @Output() restore = new EventEmitter<Evento>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    title: ['', Validators.required],
    description: ['', Validators.required],
    creator: ['', Validators.required],
    participant: this.fb.array<string>([]),
    eventDate: ['', Validators.required],
    direccionExacta: ['', Validators.required],
    longitude: [0, [Validators.required, Validators.min(-180), Validators.max(180)]],
    latitude: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
    IsDeleted: [false],
  });

  get participants(): FormArray {
    return this.form.controls.participant;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['evento']) return;
    this.form.reset({
      _id: this.evento?._id ?? '',
      title: this.evento?.title ?? '',
      description: this.evento?.description ?? '',
      creator:
        typeof this.evento?.creator === 'string'
          ? this.evento.creator
          : (this.evento?.creator?._id ?? ''),
      participant: [],
      eventDate: this.toLocalDate(this.evento?.eventDate),
      direccionExacta: this.evento?.direccionExacta ?? '',
      longitude: this.evento?.location.coordinates[0] ?? 0,
      latitude: this.evento?.location.coordinates[1] ?? 0,
      IsDeleted: this.evento?.IsDeleted ?? false,
    });
    this.participants.clear();
    this.evento?.participant.forEach((user) =>
      this.participants.push(
        this.fb.control(typeof user === 'string' ? user : (user._id ?? ''), { nonNullable: true }),
      ),
    );
  }

  selected(id: string): boolean {
    return this.participants.getRawValue().includes(id);
  }
  toggle(id: string, checked: boolean): void {
    const index = this.participants.getRawValue().indexOf(id);
    if (checked && index < 0) this.participants.push(this.fb.control(id, { nonNullable: true }));
    if (!checked && index >= 0) this.participants.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.value());
  }
  onDelete(): void {
    const value = this.value();
    if (value._id) this.delete.emit(value);
  }
  onRestore(): void {
    const value = this.value();
    if (value._id) this.restore.emit(value);
  }

  private value(): Evento {
    const value = this.form.getRawValue();
    return {
      _id: value._id || undefined,
      title: value.title.trim(),
      description: value.description.trim(),
      creator: value.creator,
      participant: value.participant.filter((id): id is string => !!id),
      eventDate: value.eventDate,
      location: { type: 'Point', coordinates: [Number(value.longitude), Number(value.latitude)] },
      direccionExacta: value.direccionExacta.trim(),
      IsDeleted: value.IsDeleted,
    };
  }

  private toLocalDate(value: string | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
