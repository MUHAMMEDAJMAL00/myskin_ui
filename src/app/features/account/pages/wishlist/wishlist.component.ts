import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { CartService } from '../../../../core/services/cart.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { WishlistItem } from '../../../../core/models/wishlist.model';

@Component({
  standalone: false,
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent implements OnInit, OnDestroy {
  items: WishlistItem[] = [];
  private subscription = new Subscription();

  constructor(
    private wishlist: WishlistService,
    private cart: CartService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.subscription.add(this.wishlist.items$.subscribe((items) => (this.items = items)));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  remove(item: WishlistItem): void {
    this.wishlist.remove(item._id);
    this.toast.info('Item removed from wishlist.');
  }

  isOutOfStock(item: WishlistItem): boolean {
    if (!item.product.is_active) return true;
    const inv = item.product.ProductInventories;
    if (inv && inv.length > 0) {
      return Number(inv[0].quantity) <= 0;
    }
    if (item.product.is_service) return false;
    return false;
  }

  addToCart(item: WishlistItem): void {
    if (this.isOutOfStock(item)) {
      this.toast.error('This item is currently out of stock.');
      return;
    }
    if (this.cart.isInCart(item.product.id)) {
      this.toast.info('This item is already in your cart.');
      return;
    }

    this.cart.addToCart(item.product, 1);
    this.toast.success('Item added to cart!');
    this.wishlist.remove(item._id);
    this.toast.info('Item removed from wishlist.');
  }
}
