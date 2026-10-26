import { Component, HostBinding, Input } from '@angular/core';
import { Product, ProductInventory } from '../../../core/models/product.model';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  @Input() fixedHeight = false;

  @HostBinding('class.product-card-host--fixed')
  get isFixedHeight(): boolean {
    return this.fixedHeight;
  }

  get discountBadge(): string | null {
    const d = this.product.Discount;
    if (d && d.is_active !== 0) {
      if (d.discount_type === 'percent') return d.discount_value + '% OFF';
      if (d.discount_type === 'flat') return '₹' + d.discount_value + ' OFF';
    }
    const offers = this.product.OfferProducts;
    if (offers && offers.length > 0) {
      const o = offers[0]?.offer;
      if (o && o.is_active !== 0) {
        if (o.discount_type === 'percent') return o.discount_value + '% OFF';
        if (o.discount_type === 'flat') return '₹' + o.discount_value + ' OFF';
      }
    }
    return null;
  }

  get stockQty(): number {
    if (this.product.is_service) return 999;
    const inv = this.product.ProductInventories;
    if (inv && inv.length > 0) {
      return Number(inv[0].quantity);
    }
    return 0;
  }

  get isOutOfStock(): boolean {
    return this.stockQty <= 0;
  }

  get hasStockInfo(): boolean {
    return !this.product.is_service;
  }

  constructor(private wishlist: WishlistService, private toast: ToastService) {}

  addToWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.wishlist.isWishlisted(this.product.id)) {
      this.toast.info('This item is already in your wishlist.');
      return;
    }

    this.wishlist.add(this.product);
    this.toast.success('Successfully added to wishlist!');
  }
}
