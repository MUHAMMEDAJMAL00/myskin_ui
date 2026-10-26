import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  standalone: false,
  selector: 'app-user-sidebar',
  templateUrl: './user-sidebar.component.html',
  styleUrl: './user-sidebar.component.scss',
})
export class UserSidebarComponent {
  constructor(
    private router: Router,
    private auth: AuthService,
    private cart: CartService,
    private wishlist: WishlistService,
    private toast: ToastService,
  ) {}

  get userName(): string {
    return this.auth.currentCustomer?.name || 'User';
  }

  get userEmail(): string {
    return this.auth.currentCustomer?.email || '';
  }

  get isMyOrdersActive(): boolean {
    return this.router.url.startsWith('/my-orders');
  }

  get isAddressesActive(): boolean {
    return this.router.url.startsWith('/account/addresses');
  }

  goToMyOrders(): void {
    this.router.navigate(['/my-orders']);
  }

  goToAddresses(): void {
    this.router.navigate(['/account/addresses']);
  }

  logout(): void {
    this.auth.logout();
    this.cart.clearCart();
    this.wishlist.clearWishlist();
    this.toast.success('Logged out successfully!');
    this.router.navigate(['/']);
  }
}
