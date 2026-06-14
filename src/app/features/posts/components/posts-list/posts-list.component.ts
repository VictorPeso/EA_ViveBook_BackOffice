import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AdminListQuery, AdminSearchField } from '../../../../Core/models/admin-list.model';
import { Post } from '../../../../Core/models/post.model';
import { AdminListComponent } from '../../../../shared/components/admin-list/admin-list.component';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, AdminListComponent],
  templateUrl: './posts-list.component.html',
  styleUrl: './posts-list.component.css',
})
export class PostsListComponent {
  @Input() posts: Post[] = [];
  @Input() selectedId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 5;
  @Input() isAdmin = true;

  @Output() selectPost = new EventEmitter<Post>();
  @Output() createNew = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<AdminListQuery>();
  @Output() permanentDelete = new EventEmitter<Post>();

  readonly searchFields: AdminSearchField[] = [
    { value: 'book', label: 'Libro' },
    { value: 'owner', label: 'Propietario' },
    { value: 'price', label: 'Precio' },
    { value: 'status', label: 'Estado' },
    { value: '_id', label: 'ID de MongoDB' },
  ];

  owner(post: Post): string {
    if (typeof post.ownerId === 'string') return post.ownerId;
    return post.ownerId.name || post.ownerId.email || post.ownerId._id || '-';
  }

  book(post: Post): string {
    if (typeof post.bookId === 'string') return post.bookId;
    return post.bookId.title || post.bookId.isbn || post.bookId._id || '-';
  }

  onSelect(post: Post): void {
    this.selectPost.emit(post);
  }

  onPermanentDelete(event: MouseEvent, post: Post): void {
    event.stopPropagation();
    this.permanentDelete.emit(post);
  }

  onRowKeydown(event: KeyboardEvent, post: Post): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onSelect(post);
  }

  trackByPostId(index: number, post: Post): string | number {
    return post._id ?? index;
  }
}
