import { Component, inject, OnInit, signal } from '@angular/core';
import { PostsService } from '../../../../Core/services/posts.service';
import { Post } from '../../../../Core/models/post.model';
import { ToastService } from '../../../../Core/services/toast.service';
import { Toast } from '../../../../shared/components/toast/toast';
import { PostModal } from '../../components/post-modal/post-modal';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-posts-page',
  imports: [Toast, PostModal, FormsModule],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.css',
})
export class PostsPage  implements OnInit{
  service = inject(PostsService);
  toast = inject(ToastService);
  posts = signal<Post[]>([]);
  // addText : string = '';

  description? : string = undefined;
  status? : string = undefined;
  image? : string = undefined;
  ownerId? : string = undefined;


  editMode = signal<boolean>(false);
  
  ngOnInit(): void {
    this.apiCall();
  }

  apiCall(){
    this.service.readAllPost()
      .subscribe({
        next: (res) => {this.posts.set(res);},
        error: (err) => {this.toast.show('error',err);}
      })
  }

  onCrearBtnClick(){
    // if(this.addMode() === false) this.addMode.set(true);
    // else {
    //   if(this.addText === '')
    //     this.toast.show('error',"Isbn cannot be empty!");
    //   else this.service.createPostByIsbn(,this.addText)
    //     .subscribe({
    //       next: (res) => {this.buffer.set(res)},
    //       error: (err) => { console.log(err)}
    //     });
    // }

  }

  onEditBtnClick(id: string){
    if(!this.editMode()) this.editMode.set(true);
    else {
      this.editMode.set(false);
      if(!this.description && !this.status && !this.image && !this.ownerId) return;
      const data : Partial<Post> = {
        description: this.description,
        status: this.status,
        imageUrl: this.image,
        ownerId: this.ownerId
      }
      this.service.updatePost(id,data)
        .subscribe({
          next: (res) => {this.toast.show('info',`Data changed! \n ${JSON.stringify(res)}`)},
          error: (err) => { this.toast.show('error',JSON.stringify(err))}
        });
        //this.apiCall(); // Al parecer no lo refresca
    }
  }
  onDeleteBtnClick(id: string){
    this.service.deletePost(id)
      .subscribe({
        next: (res) => {this.toast.show('info',`Post deleted! \n ${JSON.stringify(res)}`)},
        error: (err) => { this.toast.show('error',JSON.stringify(err))}
      });
      //this.apiCall(); // Al parecer no lo refresca
  }
}
