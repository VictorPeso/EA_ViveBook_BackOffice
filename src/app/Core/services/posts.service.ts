import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Post } from '../models/post.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/posts';

  createPost( object : Post) : Observable<Post> {
    return this.http.post<Post>(this.apiUrl,  object);
  }

  readAllPost() : Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  readPostById(id : string) : Observable<Post> {
    return this.http.get<Post>(` ${this.apiUrl}/${id}`);
  }

  updatePost(id : string, data: Partial<Post>) : Observable<Post>{
    return this.http.put<Post>(`${this.apiUrl}/${id}`, data);
  }

  deletePost(id : string) : Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createPostByIsbn(data : Partial<Post>, isbn : string) : Observable<Post> {
    return this.http.post<Post>( `${this.apiUrl}/${isbn}`, data);
  }
}
