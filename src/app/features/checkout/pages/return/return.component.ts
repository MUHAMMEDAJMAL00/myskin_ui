import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  standalone: false,
  selector: 'app-return',
  templateUrl: './return.component.html',
  styleUrl: './return.component.scss',
})
export class ReturnComponent implements OnInit {
  orderId: string | null = null;
  item: any = null;
  showModal = false;
  reasonType = '';
  description = '';
  submitting = false;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    const state = history.state || {};
    this.orderId = state.orderId ?? null;
    this.item = state.item ?? null;
  }

  openModal(): void {
    this.reasonType = '';
    this.description = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submit(): void {
    if (!this.reasonType) {
      this.toast.error('Please select a reason.');
      return;
    }
    if (this.reasonType === 'other' && !this.description.trim()) {
      this.toast.error('Please enter a description for your return.');
      return;
    }

    this.submitting = true;
    this.api.post('/storefront/returns', {
      order_id: Number(this.orderId),
      items: [{
        product_id: this.item?.productId || this.item?.product_id,
        quantity: this.item?.qty || this.item?.quantity || 1,
      }],
      notes: this.reasonType === 'other' ? this.description : this.reasonType,
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.success('Return request submitted successfully!');
          this.closeModal();
        } else {
          this.toast.error(res.message || 'Failed to submit return');
        }
        this.submitting = false;
      },
      error: () => {
        this.toast.error('Failed to submit return request. Please try again.');
        this.submitting = false;
      },
    });
  }
}
