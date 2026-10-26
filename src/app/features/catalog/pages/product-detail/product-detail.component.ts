import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Product, ProductVariant } from '../../../../core/models/product.model';
import { resolveImageUrl } from '../../../../core/utils/image.util';

@Component({
  standalone: false,
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  quantity = 1;
  selectedVariant: ProductVariant | null = null;
  showFullDescription = false;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cart: CartService,
    private wishlist: WishlistService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        const id = Number(params.get('id'));
        this.product = null;
        this.selectedVariant = null;
        this.quantity = 1;
        this.showFullDescription = false;
        this.productService.getById(id).subscribe({
          next: (product) => {
            this.product = product;
          },
          error: () => (this.product = null),
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get hasVariants(): boolean {
    return !!(this.product?.variants && this.product.variants.length > 0);
  }

  get currentPrice(): number {
    if (this.selectedVariant) return Number(this.selectedVariant.selling_price);
    return this.product ? Number(this.product.selling_price) : 0;
  }

  get currentMrp(): number {
    if (this.selectedVariant && this.selectedVariant.mrp) return Number(this.selectedVariant.mrp);
    return this.product ? Number(this.product.mrp) || 0 : 0;
  }

  get discountBadge(): string | null {
    const p = this.product;
    if (!p) return null;
    const d = (p as any).Discount;
    if (d && d.is_active !== 0) {
      if (d.discount_type === 'percent') return d.discount_value + '% OFF';
      if (d.discount_type === 'flat') return '₹' + d.discount_value + ' OFF';
    }
    const offers = (p as any).OfferProducts;
    if (offers && offers.length > 0) {
      const o = offers[0]?.offer;
      if (o && o.is_active !== 0) {
        if (o.discount_type === 'percent') return o.discount_value + '% OFF';
        if (o.discount_type === 'flat') return '₹' + o.discount_value + ' OFF';
      }
    }
    return null;
  }

  get currentTaxRate(): number {
    return this.product ? Number(this.product.tax_rate) : 0;
  }

  get currentTaxIncluded(): number {
    return this.product ? this.product.tax_included : 0;
  }

  get currentImage(): string {
    return this.selectedVariant?.image_url || this.product?.image_url || '';
  }

  selectVariant(variant: ProductVariant | null): void {
    this.selectedVariant = variant;
    this.quantity = 1;
  }

  get isInCart(): boolean {
    if (!this.product) return false;
    return this.cart.isInCart(this.product.id, this.selectedVariant?.id);
  }

  get isWishlisted(): boolean {
    if (!this.product) return false;
    return this.wishlist.isWishlisted(this.product.id, this.selectedVariant?.id);
  }

  get stockQty(): number {
    if (this.product?.is_service) return 999;
    const inv = this.product?.ProductInventories;
    if (inv && inv.length > 0) {
      return Number(inv[0].quantity);
    }
    return 0;
  }

  get hasStockInfo(): boolean {
    return !!this.product && !this.product.is_service;
  }

  get stockStatus(): { label: string; class: string } {
    if (this.product?.is_service) return { label: 'Available', class: 'text-success' };
    if (this.stockQty <= 0) return { label: 'Out of Stock', class: 'text-danger' };
    if (this.stockQty <= (this.product?.alert_quantity || 5)) return { label: `Only ${this.stockQty} left`, class: 'text-warning' };
    return { label: 'In Stock', class: 'text-success' };
  }

  get isOutOfStock(): boolean {
    return !this.product?.is_service && this.stockQty <= 0;
  }

  toggleDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  toggleWishlist(): void {
    if (!this.product) return;
    const variantId = this.selectedVariant?.id || null;
    if (this.isWishlisted) {
      const item = this.wishlist.items.find((i) =>
        i.product.id === this.product!.id && (variantId ? i.variantId === variantId : !i.variantId)
      );
      if (item) {
        this.wishlist.remove(item._id);
        this.toast.info('Removed from wishlist.');
      }
    } else {
      this.wishlist.add(this.product, this.selectedVariant);
      this.toast.success('Added to wishlist!');
    }
  }

  get totalPrice(): number {
    return this.currentPrice * this.quantity;
  }

  formatPrice(val: string | number): string {
    return Number(val).toFixed(2);
  }

  increment(): void {
    this.quantity += 1;
  }

  decrement(): void {
    if (this.quantity > 1) this.quantity -= 1;
  }

  addToCart(): void {
    if (!this.product) return;
    this.cart.addToCart(this.product, this.quantity, this.selectedVariant || undefined);
    this.toast.success('Successfully added to cart!');
    this.router.navigate(['/cart']);
  }

  buyNow(): void {
    if (!this.product) return;
    this.router.navigate(['/checkout'], {
      state: {
        buyNowItem: {
          name: this.product.name,
          productId: this.product.id,
          variantId: this.selectedVariant?.id || null,
          qty: this.quantity,
          price: this.currentPrice,
          image: resolveImageUrl(this.currentImage),
          mrp: this.currentMrp,
          taxRate: this.currentTaxRate,
          taxIncluded: this.currentTaxIncluded,
        },
      },
    });
  }
}
