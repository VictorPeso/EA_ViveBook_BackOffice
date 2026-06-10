import { Component, inject, OnInit, signal } from '@angular/core';
import { PostsService } from '../../../../Core/services/posts.service';
import { Post } from '../../../../Core/models/post.model';
import { ToastService } from '../../../../Core/services/toast.service';
import { Toast } from '../../../../shared/components/toast/toast';
import { PostModal } from '../../components/post-modal/post-modal';
import { FormsModule } from '@angular/forms';
import { PostIndividual } from '../../components/post-individual/post-individual';

@Component({
  selector: 'app-posts-page',
  imports: [Toast, PostModal, FormsModule, PostIndividual],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.css',
})
export class PostsPage implements OnInit {
  service = inject(PostsService);
  toast = inject(ToastService);
  posts = signal<Post[]>([]);
  // addText : string = '';

  ngOnInit(): void {
    this.apiCall();
  }

  apiCall() {
    this.service.readAllPost().subscribe({
      next: (res) => {
        this.posts.set(res);
      },
      error: (err) => {
        this.toast.show('error', err);
      },
    });
  }

  // onCrearBtnClick(){
  //   if(this.addMode() === false) this.addMode.set(true);
  //   else {
  //     if(this.addText === '')
  //       this.toast.show('error',"Isbn cannot be empty!");
  //     else this.service.createPostByIsbn(,this.addText)
  //       .subscribe({
  //         next: (res) => {this.buffer.set(res)},
  //         error: (err) => { console.log(err)}
  //       });
  //   }

  // }
}
