import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { Libro } from '../../../../Core/models/libro.model';
import { Reserva } from '../../../../Core/models/reserva.model';
import { Usuario } from '../../../../Core/models/usuario.model';

@Component({
  selector: 'app-reservas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservas-list.component.html',
  styleUrl: './reservas-list.component.css',
})
export class ReservasListComponent implements OnInit, OnDestroy {
  @Input() reservas: Reserva[] = [];
  @Input() selectedId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 5;
  @Output() selectReserva = new EventEmitter<Reserva>();
  @Output() createNew = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();

  readonly searchControl = new FormControl('');
  private readonly destroy = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy))
      .subscribe((value) => this.search.emit(value ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get showingFrom(): number {
    return this.totalItems ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  user(value: string | Usuario): string {
    return typeof value === 'string' ? value : value.name;
  }

  book(value: string | Libro): string {
    return typeof value === 'string' ? value : value.title;
  }
}
