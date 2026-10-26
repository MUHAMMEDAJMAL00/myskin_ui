import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { WishlistItem } from '../models/wishlist.model';
import { Product, ProductVariant } from '../models/product.model';

const WISHLIST_KEY = 'myskin_web_wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private itemsSubject = new BehaviorSubject<WishlistItem[]>(this.readWishlist());
  items$ = this.itemsSubject.asObservable();

  get items(): WishlistItem[] {
    return this.itemsSubject.value;
  }

  constructor(private api: ApiService) {}

  isWishlisted(productId: number, variantId?: number | null): boolean {
    if (variantId) {
      return this.itemsSubject.value.some(
        (item) => item.product.id === productId && item.variantId === variantId,
      );
    }
    return this.itemsSubject.value.some((item) => item.product.id === productId && !item.variantId);
  }

  add(product: Product, variant?: ProductVariant | null): void {
    const variantId = variant?.id || null;
    if (this.isWishlisted(product.id, variantId)) return;
    const items = [
      ...this.itemsSubject.value,
      {
        _id: `wish_${Date.now()}`,
        product,
        price: variant ? Number(variant.selling_price) : Number(product.selling_price),
        variantId,
        variantName: variant?.variant_name || null,
      },
    ];
    this.persist(items);
    this.api.post('/customer-wishlist', { product_id: product.id }).subscribe({ error: () => {} });
  }

  remove(itemId: string): void {
    this.persist(this.itemsSubject.value.filter((item) => item._id !== itemId));
  }

  clearWishlist(): void {
    this.persist([]);
    this.api.delete('/customer-wishlist').subscribe({ error: () => {} });
  }

  private persist(items: WishlistItem[]): void {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  private readWishlist(): WishlistItem[] {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
