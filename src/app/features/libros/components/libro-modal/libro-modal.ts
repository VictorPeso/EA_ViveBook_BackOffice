import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Toast } from '../../../../shared/components/toast/toast';
import { ToastService } from '../../../../Core/services/toast.service';

@Component({
  selector: 'app-libro-modal',
  imports: [Toast],
  templateUrl: './libro-modal.html',
  styleUrl: './libro-modal.css',
})
export class LibroModal {
  
  isbnInput = signal<string>('');
  toast = inject(ToastService);

  @ViewChild('dialog') dialog!: ElementRef;
  OpenDialog(){
    this.dialog.nativeElement.showModal();
    this.toast.show('info', 'Modal has been created');
  }
  onCall(){
    this.dialog.nativeElement.close();
  }
  
}
