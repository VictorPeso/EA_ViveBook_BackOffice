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
import {
  AdminEditorComponent,
  AdminEditorSectionDirective,
} from '../../../../shared/components/admin-editor/admin-editor.component';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminEditorComponent, AdminEditorSectionDirective],
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

  get participantesAsociados(): Usuario[] {
    const referenceMap = new Map(
      (this.evento?.participant ?? []).map((usuario) => {
        const reference =
          typeof usuario === 'string'
            ? { _id: usuario, name: 'Usuario sin datos', email: '', rol: 'User' as const }
            : usuario;
        return [reference._id ?? '', reference] as const;
      }),
    );
    return this.participants
      .getRawValue()
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
      .map(
        (id) =>
          referenceMap.get(id) ?? {
            _id: id,
            name: 'Usuario sin datos',
            email: '',
            rol: 'User',
          },
      );
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo evento' : 'Editar evento';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear un nuevo evento.'
      : 'Modifica los datos del evento seleccionado.';
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

  trackByUsuarioId(index: number, usuario: Usuario): string | number {
    return usuario._id ?? index;
  }

  removeParticipant(usuarioId: string): void {
    const index = this.participants.getRawValue().indexOf(usuarioId);
    if (index < 0) return;
    this.participants.removeAt(index);
    this.participants.markAsDirty();
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

  onCancel(): void {
    this.cancel.emit();
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
