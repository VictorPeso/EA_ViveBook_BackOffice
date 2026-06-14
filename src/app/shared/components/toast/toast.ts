import { Component, inject } from '@angular/core';
import { ToastService } from '../../../Core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  protected readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;
}
