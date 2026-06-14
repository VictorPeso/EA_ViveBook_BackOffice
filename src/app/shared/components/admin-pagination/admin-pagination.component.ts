import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface AdminPaginationChange {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-admin-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pagination.component.html',
  styleUrl: './admin-pagination.component.css',
})
export class AdminPaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];

  @Output() paginationChange = new EventEmitter<AdminPaginationChange>();

  isOpen = false;
  pendingPageSize = 10;
  blockStart = 1;

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly blockNumberCapacity = 11;
  private readonly finalBlockCapacity = 12;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pageSize']) {
      this.pendingPageSize = this.pageSize;
    }

    if (changes['currentPage'] || changes['totalPages']) {
      this.blockStart = this.getBlockStart(this.currentPage);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.isOpen = false;
    this.pendingPageSize = this.pageSize;
    this.blockStart = this.getBlockStart(this.currentPage);
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.pendingPageSize = this.pageSize;
      this.blockStart = this.getBlockStart(this.currentPage);
    }
  }

  previousPage(): void {
    this.selectPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.selectPage(this.currentPage + 1);
  }

  selectPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      this.close();
      return;
    }

    this.isOpen = false;
    this.paginationChange.emit({ page, pageSize: this.pageSize });
  }

  showNextBlock(): void {
    if (!this.hasNextBlock) return;
    this.blockStart += this.blockNumberCapacity;
  }

  applyPageSize(): void {
    const validPageSize = this.pageSizeOptions.includes(this.pendingPageSize)
      ? this.pendingPageSize
      : this.pageSize;
    const nextTotalPages = Math.max(Math.ceil(this.totalItems / validPageSize), 1);
    const nextPage = Math.min(this.currentPage, nextTotalPages);

    this.isOpen = false;
    this.paginationChange.emit({ page: nextPage, pageSize: validPageSize });
  }

  get visiblePages(): number[] {
    const capacity = this.hasNextBlock ? this.blockNumberCapacity : this.finalBlockCapacity;
    const count = Math.min(capacity, Math.max(this.totalPages - this.blockStart + 1, 0));
    return Array.from({ length: count }, (_, index) => this.blockStart + index);
  }

  get hasNextBlock(): boolean {
    return this.totalPages - this.blockStart + 1 > this.finalBlockCapacity;
  }

  private getBlockStart(page: number): number {
    const safePage = Math.max(1, Math.min(page, Math.max(this.totalPages, 1)));
    return Math.floor((safePage - 1) / this.blockNumberCapacity) * this.blockNumberCapacity + 1;
  }
}
