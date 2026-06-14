import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { AdminListQuery, AdminSearchField } from '../../../Core/models/admin-list.model';
import {
  AdminPaginationChange,
  AdminPaginationComponent,
} from '../admin-pagination/admin-pagination.component';

@Component({
  selector: 'app-admin-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminPaginationComponent],
  templateUrl: './admin-list.component.html',
  styleUrl: './admin-list.component.css',
})
export class AdminListComponent implements OnInit, OnDestroy {
  @Input({ required: true }) title = '';
  @Input() itemLabel = 'elementos';
  @Input() emptyMessage = 'No hay elementos disponibles.';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() searchFields: AdminSearchField[] = [];
  @Input() initialSearchField = '';
  @Input() isLoading = false;
  @Input() canCreate = false;
  @Input() createLabel = 'Nuevo elemento';
  @Input() visibleItems = 0;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 10;

  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() createNew = new EventEmitter<void>();

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly searchFieldControl = new FormControl('', { nonNullable: true });
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    const firstField = this.initialSearchField || this.searchFields[0]?.value || '';
    this.searchFieldControl.setValue(firstField, { emitEvent: false });

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.emitQuery(1));

    this.searchFieldControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.emitQuery(1));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPaginationChange(change: AdminPaginationChange): void {
    this.emitQuery(change.page, change.pageSize);
  }

  get showingFrom(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  private emitQuery(page: number, pageSize = this.pageSize): void {
    this.queryChange.emit({
      search: this.searchControl.value.trim(),
      searchField: this.searchFieldControl.value,
      page,
      pageSize,
    });
  }
}
