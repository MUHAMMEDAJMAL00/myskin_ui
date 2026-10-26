import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CartService } from '../../../../core/services/cart.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CartItem } from '../../../../core/models/cart.model';

@Component({
  standalone: false,
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  private subscription = new Subscription();

  constructor(private cart: CartService, private toast: ToastService) {}

  ngOnInit(): void {
    this.subscription.add(this.cart.cartItems$.subscribe((items) => (this.cartItems = items)));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get cartCount(): number {
    return this.cartItems.length;
  }

  get totalPrice(): string {
    return this.cartItems.reduce((acc, item) => acc + item.price, 0).toFixed(2);
  }

  increment(item: CartItem): void {
    this.cart.updateQuantity(item._id, item.quantity + 1);
  }

  decrement(item: CartItem): void {
    if (item.quantity > 1) this.cart.updateQuantity(item._id, item.quantity - 1);
  }

  removeItem(item: CartItem): void {
    if (!confirm('Are you sure you want to delete this item?')) return;
    this.cart.removeItem(item._id);
    this.toast.success('Item removed from cart.');
  }

  removeAll(): void {
    if (!confirm('Are you sure you want to remove all items from the cart?')) return;
    this.cart.clearCart();
    this.toast.success('Deleted');
  }
}
