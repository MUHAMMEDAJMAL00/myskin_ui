import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { CartItem } from '../models/cart.model';
import { Product, ProductVariant } from '../models/product.model';

const CART_KEY = 'myskin_web_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.readCart());
  cartItems$ = this.cartItemsSubject.asObservable();

  get cartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  get cartCount(): number {
    return this.cartItemsSubject.value.length;
  }

  constructor(private api: ApiService) {}

  isInCart(productId: number, variantId?: number): boolean {
    if (variantId) {
      return this.cartItemsSubject.value.some(
        (item) => item.product.id === productId && item.variantId === variantId,
      );
    }
    return this.cartItemsSubject.value.some((item) => item.product.id === productId);
  }

  addToCart(product: Product, quantity: number, variant?: ProductVariant): void {
    const items = [...this.cartItemsSubject.value];
    const unitPrice = variant ? Number(variant.selling_price) : Number(product.selling_price);
    const variantId = variant?.id || null;

    const existing = items.find((item) =>
      item.product.id === product.id && item.variantId === variantId,
    );

    if (existing) {
      existing.quantity += quantity;
      existing.price = Number((unitPrice * existing.quantity).toFixed(2));
    } else {
      items.push({
        _id: `cart_${Date.now()}`,
        product,
        variantId,
        variantName: variant?.variant_name || null,
        quantity,
        price: Number((unitPrice * quantity).toFixed(2)),
      });
    }

    this.persist(items);
    this.api.post('/customer-cart', { product_id: product.id, quantity, variant_id: variantId }).subscribe({ error: () => {} });
  }

  updateQuantity(cartItemId: string, quantity: number): void {
    const items = this.cartItemsSubject.value.map((item) =>
      item._id === cartItemId
        ? { ...item, quantity, price: Number((Number(item.product.selling_price) * quantity).toFixed(2)) }
        : item
    );
    this.persist(items);
  }

  removeItem(cartItemId: string): void {
    this.persist(this.cartItemsSubject.value.filter((item) => item._id !== cartItemId));
  }

  clearCart(): void {
    this.persist([]);
    this.api.delete('/customer-cart').subscribe({ error: () => {} });
  }

  private persist(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    this.cartItemsSubject.next(items);
  }

  private readCart(): CartItem[] {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
