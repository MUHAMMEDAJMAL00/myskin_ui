import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../../../core/models/order.model';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  standalone: false,
  selector: 'app-order-success',
  templateUrl: './success.component.html',
  styleUrl: './success.component.scss',
})
export class SuccessComponent implements OnInit {
  order: Order | null = null;

  constructor(private router: Router, private orderService: OrderService) {}

  ngOnInit(): void {
    this.order = (history.state?.['order'] as Order) || this.orderService.lastOrder;
    if (!this.order) {
      this.router.navigate(['/']);
    }
  }

  get orderNumber(): string {
    return this.order ? this.order.invoice_number : '';
  }

  printInvoice(): void {
    const content = document.getElementById('invoice-content');
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice #${this.orderNumber}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>body{padding:40px;font-family:'DM Sans',sans-serif;} table{width:100%;} td,th{padding:8px;}</style>
      </head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      shipped: '#f97316',
      delivered: '#10b981',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return map[status] || '#6b7280';
  }

  statusBg(status: string): string {
    const map: Record<string, string> = {
      pending: '#fef3c7',
      confirmed: '#dbeafe',
      processing: '#f5f3ff',
      shipped: '#fff7ed',
      delivered: '#d1fae5',
      completed: '#d1fae5',
      cancelled: '#fee2e2',
    };
    return map[status] || '#f3f4f6';
  }
}
