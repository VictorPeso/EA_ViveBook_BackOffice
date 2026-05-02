import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { PostsService } from '../../../../Core/services/posts.service';
import { ToastService } from '../../../../Core/services/toast.service';
import { Post } from '../../../../Core/models/post.model';
import { FormsModule} from '@angular/forms';

@Component({
  selector: 'app-post-modal',
  imports: [FormsModule],
  templateUrl: './post-modal.html',
  styleUrl: './post-modal.css',
  standalone: true
})
export class PostModal {
  service = inject(PostsService);
  toast = inject(ToastService);
  posts = signal<Post[]>([]);
  isbn : string = '';
  description : string = '';
  status : string = ''; // VENTA ALQUILER NO_DISPONIBLE
  imageUrl : string = '';
  ownerId : string = '';


  @ViewChild('dialog') dialog!: ElementRef;
  OpenDialog() {
    this.dialog.nativeElement.showModal();
    //this.toast.show('info', 'Modal has been created');
  }

  onCall(){
    this.dialog.nativeElement.close();
    if(this.isbn === '' || this.description === '' || this.status === ''|| this.ownerId === '')
    {
      this.toast.show('error', "Algunos campos estan vacios!");
    }
    else {
      const data : Partial<Post> = {
        description: this.description,
        status: this.status,
        imageUrl: this.imageUrl,
        ownerId: this.ownerId,
      }
      this.service.createPostByIsbn(data,this.isbn)
        .subscribe({
          next: (res) => {this.toast.show('info',`Post created successfully: \n ${JSON.stringify(res)}`)},
          error: (err) => { this.toast.show('error',err)}
        });
    }
  }
}
