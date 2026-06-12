import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { Post, PostStatus } from '../models/post.model';

export interface AdminPostsQuery {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
  status?: PostStatus;
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly adminApiUrl = environment.apiUrl + '/admin/posts';

  getAdminPosts(query: AdminPostsQuery): Observable<PaginatedResult<Post>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit)
      .set('includeDeleted', query.includeDeleted ?? true);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.status) params = params.set('status', query.status);

    return this.http
      .get<ApiResponse<PaginatedResult<Post>>>(this.adminApiUrl, { params })
      .pipe(map((response) => response.data));
  }

  createPost(post: Post): Observable<Post> {
    return this.http
      .post<ApiResponse<Post>>(this.adminApiUrl, post)
      .pipe(map((response) => response.data));
  }

  updatePost(id: string, post: Partial<Post>): Observable<Post> {
    return this.http
      .put<ApiResponse<Post>>(`${this.adminApiUrl}/${id}`, post)
      .pipe(map((response) => response.data));
  }

  softDeletePost(id: string): Observable<Post> {
    return this.http
      .delete<ApiResponse<Post>>(`${this.adminApiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  restorePost(id: string): Observable<Post> {
    return this.http
      .patch<ApiResponse<Post>>(`${this.adminApiUrl}/${id}/status`, { IsDeleted: false })
      .pipe(map((response) => response.data));
  }
}
