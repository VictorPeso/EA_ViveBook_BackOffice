import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

export type ToastType = 'info' | 'error' | 'warning' ;

@Injectable({
  providedIn: 'root',
})
export class ToastService {

  toasts = signal<ToastMessage[]>([]);

  private toastDuration = 3000;

  show(type: ToastType, text: string): void {
    const id = Date.now();

    const toast = {
      id, type, text
    };

    setTimeout(() => {
      this.remove(id);
    }, this.toastDuration);

    this.toasts.update(toasts => [...toasts, toast]);
  }

  remove(id: number): void {
    this.toasts.update(currentToasts =>
      currentToasts.filter(toast => toast.id !== id)
    );
  }
}
