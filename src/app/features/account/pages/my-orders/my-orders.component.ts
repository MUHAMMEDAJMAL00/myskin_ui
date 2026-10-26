import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';
import { Order, OrderItem } from '../../../../core/models/order.model';
import { Customer } from '../../../../core/models/user.model';

@Component({
  standalone: false,
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss',
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  currentCustomer: Customer | null = null;
  activeTab = 'all';
  showModal = false;
  showOrderModal = false;
  selectedOrder: Order | null = null;
  expandedOrderId: number | null = null;
  formData: Partial<Customer> = {};
  loading = true;

  tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  constructor(private auth: AuthService, private orderService: OrderService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.currentCustomer = this.auth.currentCustomer;
    this.loadOrders();
    if (this.currentCustomer) {
      this.formData = { ...this.currentCustomer };
    }
  }

  loadOrders(): void {
    this.loading = true;
    const local = this.orderService.getAllOrders();
    this.orders = local && local.length ? local : [];
    this.filteredOrders = [...this.orders];

    // Also try to fetch from backend for fresh data
    this.orderService.getOrdersForUser().subscribe({
      next: (result) => {
        if (result && result.data && result.data.length) {
          this.orders = result.data;
          this.filteredOrders = [...this.orders];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get totalSpent(): number {
    return this.orders.reduce((s, o) => s + o.total_amount, 0);
  }

  get orderCount(): number {
    return this.orders.length;
  }

  countByStatus(status: string): number {
    return this.orders.filter((o) => o.status === status).length;
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter((o) => o.status === tab);
    }
  }

  toggleOrder(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  openOrderModal(order: Order): void {
    this.selectedOrder = order;
    this.showOrderModal = true;
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.selectedOrder = null;
  }

  openEditModal(): void {
    this.showModal = true;
  }

  closeEditModal(): void {
    this.showModal = false;
  }

  saveProfile(): void {
    if (this.currentCustomer) {
      this.auth.updateProfile(this.formData).then(() => {
        this.currentCustomer = this.auth.currentCustomer;
        this.showModal = false;
      });
    }
  }

  viewOrRequestReturn(order: Order, item: OrderItem): void {
    this.router.navigate(['/checkout/return'], { state: { orderId: String(order.id), item } });
  }

  cancelOrder(order: Order): void {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => {
        order.status = 'cancelled';
        this.loadOrders();
      },
      error: () => {
        order.status = 'cancelled';
        this.loadOrders();
      },
    });
  }

  getStatusSteps(status: string): { label: string; active: boolean; passed: boolean }[] {
    const flow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const idx = flow.indexOf(status);
    return flow.map((s, i) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      active: i === idx,
      passed: idx > i || (status === 'completed' && i < 4),
    }));
  }

  get canCancel(): boolean {
    return this.selectedOrder ? ['pending', 'confirmed'].includes(this.selectedOrder.status) : false;
  }

  cancelFromModal(): void {
    if (this.selectedOrder) this.cancelOrder(this.selectedOrder);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      pending: '#8a6d3b',
      confirmed: '#55647a',
      processing: '#6d5a7e',
      shipped: '#9a6a4f',
      delivered: '#5d7a5d',
      completed: '#5d7a5d',
      cancelled: '#a05252',
    };
    return map[status] || '#6e6a63';
  }

  statusBg(status: string): string {
    const map: Record<string, string> = {
      pending: '#f3ead8',
      confirmed: '#e9edf2',
      processing: '#ece7f1',
      shipped: '#f3e8df',
      delivered: '#e7eee3',
      completed: '#e7eee3',
      cancelled: '#f4e4e1',
    };
    return map[status] || '#f1ede5';
  }
}
