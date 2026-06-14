import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  private readonly toastDuration = 3000;
  private nextId = 0;

  show(type: ToastType, text: string): number {
    const id = ++this.nextId;

    const toast: ToastMessage = {
      id,
      type,
      text,
    };

    setTimeout(() => {
      this.remove(id);
    }, this.toastDuration);

    this.toasts.update((toasts) => [...toasts, toast]);
    return id;
  }

  success(text: string): number {
    return this.show('success', text);
  }

  error(text: string): number {
    return this.show('error', text);
  }

  warning(text: string): number {
    return this.show('warning', text);
  }

  info(text: string): number {
    return this.show('info', text);
  }

  remove(id: number): void {
    this.toasts.update((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }
}
