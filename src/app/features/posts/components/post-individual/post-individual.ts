import { Component, inject, input, signal } from '@angular/core';
import { Post } from '../../../../Core/models/post.model';
import { PostsService } from '../../../../Core/services/posts.service';
import { ToastService } from '../../../../Core/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-individual',
  imports: [FormsModule],
  templateUrl: './post-individual.html',
  styleUrl: './post-individual.css',
})
export class PostIndividual {
  data = input<Post>();
  service = inject(PostsService);
  toast = inject(ToastService);
  editMode = signal<boolean>(false);
  description? : string = undefined;
  status? : string = undefined;
  image? : string = undefined;
  ownerId? : string = undefined;

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
