import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Toast } from '../../../../shared/components/toast/toast';
import { ToastService } from '../../../../Core/services/toast.service';
import { LibrosService } from '../../../../Core/services/libros.service';
import { Libro } from '../../../../Core/models/libro.model';
import { catchError, retry, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-libro-modal',
  imports: [Toast,FormsModule],
  templateUrl: './libro-modal.html',
  styleUrl: './libro-modal.css',
})
export class LibroModal {
  isbnInput: string = '';
  toast = inject(ToastService);
  librosService = inject(LibrosService);

  @ViewChild('dialog') dialog!: ElementRef;
  OpenDialog() {
    this.dialog.nativeElement.showModal();
    this.toast.show('info', 'Modal has been created');
  }
  onCall() {
    this.dialog.nativeElement.close();
    if (this.isbnInput.length == 13) {
      this.librosService
        .createLibroByIsbn(this.isbnInput)
        // https://stackoverflow.com/questions/75514004/angular-catch-error-code-after-http-request
        .pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 404) {
              this.toast.show('error', 'Book not found!');
            }
            return throwError(
              () => new Error('Sorry, we couldn’t complete your request. Please try again later.'),
            );
          }),
        )
        .subscribe((libro: Libro) => {
          this.toast.show(
            'info',
            `Libro con titulo ${libro.title} de ${JSON.stringify(libro.authors)})`,
          );
        });
    } else {
      this.toast.show('error', 'Incorrect ISBN');
    }
  }
}
