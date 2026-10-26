import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent {
  toasts$: Observable<Toast[]>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
