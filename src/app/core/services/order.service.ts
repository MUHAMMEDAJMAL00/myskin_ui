import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Order } from '../models/order.model';

const ORDERS_KEY = 'myskin_web_orders';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private lastOrderSubject = new BehaviorSubject<Order | null>(null);
  lastOrder$ = this.lastOrderSubject.asObservable();

  get lastOrder(): Order | null {
    return this.lastOrderSubject.value;
  }

  constructor(private api: ApiService) {}

  placeOrder(payload: any): Observable<any> {
    const localId = Date.now();
    const localOrder = this.buildLocalOrder(payload, localId);

    // Save locally immediately
    const orders = this.getAll();
    orders.unshift(localOrder);
    this.saveAll(orders);
    this.lastOrderSubject.next(localOrder);

    // Try backend API
    return this.api.post<any>('/storefront/orders', payload).pipe(
      map((res) => {
        if (res.success && res.data) {
          // Update local storage with server data
          const serverOrder = this.mapBackendOrder(res.data);
          const idx = orders.findIndex((o) => o.id === localId);
          if (idx !== -1) {
            orders[idx] = serverOrder;
            this.saveAll(orders);
          }
          this.lastOrderSubject.next(serverOrder);
          return { id: res.data.id, invoice_number: res.data.invoice_number, total_amount: res.data.total_amount, status: res.data.status, source: 'online', items_count: (res.data.items || []).length };
        }
        return { id: localId, invoice_number: localOrder.invoice_number, total_amount: localOrder.total_amount, status: 'pending', source: 'storefront', items_count: localOrder.items.length };
      }),
      catchError(() => {
        return of({ id: localId, invoice_number: localOrder.invoice_number, total_amount: localOrder.total_amount, status: 'pending', source: 'storefront', items_count: localOrder.items.length });
      }),
    );
  }

  setLastOrder(order: Order): void {
    this.lastOrderSubject.next(order);
  }

  clearLastOrder(): void {
    this.lastOrderSubject.next(null);
  }

  getOrdersForUser(): Observable<{ data: Order[] }> {
    return this.api.getPaginated<any>('/storefront/orders').pipe(
      map((res) => ({
        data: (res.data || []).map((item: any) => {
          const mapped = this.mapBackendOrder(item);
          // Sync to local storage
          const local = this.getAll();
          const idx = local.findIndex((o) => o.id === mapped.id || o._id === mapped._id);
          if (idx === -1) {
            local.unshift(mapped);
            this.saveAll(local);
          }
          return mapped;
        }),
      })),
      catchError(() => of({ data: this.getAll() })),
    );
  }

  getOrderById(id: number): Observable<Order | null> {
    return this.api.get<any>(`/storefront/orders/${id}`).pipe(
      map((res) => (res.success && res.data ? this.mapBackendOrder(res.data) : null)),
      catchError(() => {
        const orders = this.getAll();
        return of(orders.find((o) => o.id === id) || null);
      }),
    );
  }

  getAllOrders(): Order[] {
    return this.getAll();
  }

  cancelOrder(id: number, notes?: string): Observable<any> {
    const orders = this.getAll();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      orders[idx].status = 'cancelled';
      this.saveAll(orders);
    }
    return this.api.patch<any>(`/sales/${id}/status`, { status: 'cancelled', notes: notes || 'Cancelled by customer' }).pipe(
      map((res) => res.data),
      catchError(() => of(null)),
    );
  }

  private mapBackendOrder(item: any): Order {
    return {
      id: item.id,
      _id: String(item.id),
      invoice_number: item.invoice_number || `INV-${item.id}`,
      customer_id: item.customer_id,
      store_id: item.store_id,
      status: item.status || 'pending',
      source: item.source || 'online',
      subtotal: Number(item.subtotal) || 0,
      discount_amount: Number(item.discount_amount) || 0,
      tax_amount: Number(item.tax_amount) || 0,
      shipping_charge: Number(item.shipping_charge) || 0,
      total_amount: Number(item.total_amount) || 0,
      paid_amount: Number(item.paid_amount) || 0,
      due_amount: Number(item.due_amount) || 0,
      payment_status: item.payment_status || 'unpaid',
      notes: item.notes || null,
      created_at: item.created_at || item.sale_date || new Date().toISOString(),
      sale_date: item.sale_date || item.created_at || new Date().toISOString(),
      items: (item.items || []).map((i: any) => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.product_name || `Item #${i.product_id}`,
        quantity: i.quantity || 1,
        unit_price: Number(i.unit_price) || 0,
        total_price: Number(i.total_price) || 0,
        discount_amount: Number(i.discount_amount) || 0,
        tax_rate: Number(i.tax_rate) || 0,
        tax_amount: Number(i.tax_amount) || 0,
      })),
      payments: (item.payments || []).map((p: any) => ({
        id: p.id,
        payment_method: p.payment_method,
        amount: Number(p.amount) || 0,
      })),
    };
  }

  private buildLocalOrder(payload: any, id: number): Order {
    return {
      id,
      _id: String(id),
      invoice_number: 'INV-' + String(id).slice(-8),
      customer_id: 0,
      store_id: 1,
      status: 'pending',
      source: 'online',
      subtotal: payload.subtotal || 0,
      discount_amount: payload.discount_total || 0,
      tax_amount: payload.tax_total || 0,
      shipping_charge: payload.delivery_charges || 0,
      total_amount: payload.total_price || 0,
      paid_amount: 0,
      due_amount: payload.total_price || 0,
      payment_status: payload.payment_method === 'cod' ? 'unpaid' : 'paid',
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
      sale_date: new Date().toISOString(),
      items: (payload.items || []).map((i: any) => ({
        product_id: i.product_id,
        product_name: i.product_name || `Item #${i.product_id}`,
        quantity: i.quantity || 1,
        unit_price: i.unit_price || 0,
        total_price: (i.unit_price || 0) * (i.quantity || 1),
        discount_amount: i.discount_amount || 0,
        tax_rate: i.tax_rate || 0,
        tax_amount: i.tax_amount || 0,
      })),
      payments: [{
        id: 1,
        payment_method: payload.payment_method || 'cod',
        amount: payload.total_price || 0,
      }],
    };
  }

  private getAll(): Order[] {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveAll(orders: Order[]): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}
