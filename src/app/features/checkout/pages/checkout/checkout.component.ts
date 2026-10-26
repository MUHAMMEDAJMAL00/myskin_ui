import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AddressService } from '../../../../core/services/address.service';
import { ApiService } from '../../../../core/services/api.service';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Address } from '../../../../core/models/address.model';
import { CartItem } from '../../../../core/models/cart.model';
import { environment } from '../../../../../environments/environment';

interface BuyNowItem {
  name: string;
  productId: number;
  variantId: number | null;
  qty: number;
  price: number;
  image: string;
  mrp: number;
  taxRate: number;
  taxIncluded: number;
}

interface LineItem {
  name: string;
  productId: number;
  variantId: number | null;
  qty: number;
  price: number;
  image: string;
  mrp: number;
  taxRate: number;
  taxIncluded: number;
  discount: number;
  taxAmount: number;
  lineTotal: number;
}

const PAYMENT_METHODS = ['Pay Online', 'Cash On Delivery (COD)', 'Pick From Shop', 'Bank Transfer'];

const EMPTY_FORM = (): Address => ({
  name: '',
  location: '',
  addressType: 'Home',
  flat: '',
  poBox: '',
  street: '',
  city: '',
  state: '',
  country: '',
  phone: '',
  fullAddress: '',
  paymentMethod: 'Pay Online',
});

function calcTax(price: number, qty: number, taxRate: number, taxIncluded: number): { taxAmount: number; baseAmount: number } {
  const total = price * qty;
  if (!taxRate) return { taxAmount: 0, baseAmount: total };

  if (taxIncluded === 1) {
    const baseAmount = total * (100 / (100 + taxRate));
    return { taxAmount: total - baseAmount, baseAmount };
  }
  const taxAmount = total * (taxRate / 100);
  return { taxAmount, baseAmount: total };
}

@Component({
  standalone: false,
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  paymentMethods = PAYMENT_METHODS;
  buyNowItem: BuyNowItem | null = null;
  cartItems: CartItem[] = [];
  lineItems: LineItem[] = [];
  subtotal = 0;
  discountTotal = 0;
  taxTotal = 0;
  deliveryCharges = 0;
  grandTotal = 0;

  couponCode = '';
  couponApplied = false;
  couponMessage = '';
  couponSuccess = false;

  savedAddresses: Address[] = [];
  selectedAddressId: string | null = null;
  showAddressForm = false;
  viewOnly = false;
  formData: Address = EMPTY_FORM();

  constructor(
    private router: Router,
    private addressService: AddressService,
    private api: ApiService,
    private cart: CartService,
    private auth: AuthService,
    private orderService: OrderService,
    private productService: ProductService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.buyNowItem = (history.state?.['buyNowItem'] as BuyNowItem) || null;
    this.savedAddresses = this.addressService.addresses;

    if (this.buyNowItem) {
      this.productService.getById(this.buyNowItem.productId).subscribe({
        next: (product) => {
          const variant = this.buyNowItem!.variantId && product.variants
            ? product.variants.find((v: any) => v.id === this.buyNowItem!.variantId)
            : null;
          this.lineItems = [this.buildLineItem(
            variant?.variant_name || product.name, product.id, this.buyNowItem!.qty,
            variant ? Number(variant.selling_price) : Number(product.selling_price),
            variant?.image_url || product.image_url || '',
            variant && variant.mrp ? Number(variant.mrp) : Number(product.mrp) || 0,
            Number(product.tax_rate), product.tax_included,
            this.buyNowItem!.variantId,
          )];
          this.calcTotals();
        },
        error: () => {
          this.toast.error('Failed to load product details');
          this.router.navigate(['/']);
        },
      });
    } else {
      this.cartItems = this.cart.cartItems;
      if (!this.cartItems.length) return;

      const productIds = [...new Set(this.cartItems.map((ci) => ci.product.id))];
      forkJoin(productIds.map((pid) => this.productService.getById(pid))).subscribe({
        next: (products) => {
          this.lineItems = [];
          this.cartItems!.forEach((ci) => {
            const product = products.find((p) => p.id === ci.product.id);
            if (product) {
              const variant = ci.variantId && product.variants
                ? product.variants.find((v: any) => v.id === ci.variantId)
                : null;
              this.lineItems.push(this.buildLineItem(
                variant?.variant_name || product.name, product.id, ci.quantity,
                variant ? Number(variant.selling_price) : Number(product.selling_price),
                variant?.image_url || product.image_url || '',
                variant && variant.mrp ? Number(variant.mrp) : Number(product.mrp) || 0,
                Number(product.tax_rate), product.tax_included,
                ci.variantId,
              ));
            }
          });
          this.calcTotals();
        },
        error: () => {
          this.toast.error('Failed to load product data');
        },
      });
    }
  }

  private buildLineItem(
    name: string,
    productId: number,
    qty: number,
    price: number,
    image: string,
    mrp: number,
    taxRate: number,
    taxIncluded: number,
    variantId: number | null = null,
  ): LineItem {
    const { taxAmount, baseAmount } = calcTax(price, qty, taxRate, taxIncluded);
    return {
      name,
      productId,
      variantId,
      qty,
      price: price * qty,
      image,
      mrp: mrp * qty,
      taxRate,
      taxIncluded,
      discount: 0,
      taxAmount,
      lineTotal: baseAmount + taxAmount,
    };
  }

  private calcTotals(): void {
    this.subtotal = this.lineItems.reduce((sum, i) => sum + (i.lineTotal - i.taxAmount), 0);
    this.taxTotal = this.lineItems.reduce((sum, i) => sum + i.taxAmount, 0);
    this.deliveryCharges = 0;
    this.discountTotal = 0;
    this.grandTotal = this.subtotal + this.taxTotal + this.deliveryCharges;
  }

  selectAddressOnly(address: Address): void {
    this.selectedAddressId = address._id!;
  }

  selectAddress(address: Address): void {
    this.selectedAddressId = address._id!;
    this.formData = { ...address };
    this.showAddressForm = true;
    this.viewOnly = true;
  }

  addNewAddress(): void {
    if (this.showAddressForm) {
      this.showAddressForm = false;
      this.viewOnly = false;
      return;
    }
    if (this.savedAddresses.length >= 2) {
      this.toast.error('You can only save up to 2 addresses.');
      return;
    }
    this.formData = EMPTY_FORM();
    this.viewOnly = false;
    this.showAddressForm = true;
  }

  cancelForm(): void {
    this.showAddressForm = false;
    this.viewOnly = false;
    this.formData = EMPTY_FORM();
  }

  saveAddress(): void {
    if (!this.auth.currentCustomer) {
      this.toast.error('Please log in.');
      return;
    }

    const saved = this.addressService.save(this.formData);
    this.savedAddresses = this.addressService.addresses;
    this.selectedAddressId = saved._id!;
    this.showAddressForm = false;
    this.viewOnly = false;
    this.toast.success('Address saved successfully!');
  }

  deleteAddress(id: string): void {
    if (!confirm('Are you sure you want to delete this address?')) return;
    this.addressService.remove(id);
    this.savedAddresses = this.addressService.addresses;
    if (this.selectedAddressId === id) {
      this.selectedAddressId = null;
      this.showAddressForm = false;
      this.viewOnly = false;
    }
  }

  setPaymentMethod(method: string): void {
    this.formData = { ...this.formData, paymentMethod: method };
  }

  placeOrder(): void {
    const customer = this.auth.currentCustomer;
    if (!customer) {
      this.toast.error('Please log in.');
      return;
    }

    const selectedAddress = this.savedAddresses.find((a) => a._id === this.selectedAddressId);
    if (!selectedAddress) {
      this.toast.error('Please select a delivery address.');
      return;
    }

    let paymentMethod = this.formData.paymentMethod || 'cod';
    if (paymentMethod === 'Cash On Delivery (COD)') paymentMethod = 'cod';
    else if (paymentMethod === 'Pay Online') paymentMethod = 'online';
    else if (paymentMethod === 'Bank Transfer') paymentMethod = 'bank_transfer';
    else if (paymentMethod === 'Pick From Shop') paymentMethod = 'cod';

    const payload: any = {
      items: this.lineItems.map((i) => ({
        product_id: i.productId,
        variant_id: i.variantId,
        quantity: i.qty,
        unit_price: i.price / i.qty,
        tax_rate: i.taxRate,
        tax_included: i.taxIncluded,
      })),
      payment_method: paymentMethod,
      subtotal: this.subtotal,
      tax_total: this.taxTotal,
      delivery_charges: this.deliveryCharges,
      total_price: this.grandTotal,
    };

    // If Pay Online, create Razorpay order first
    if (paymentMethod === 'online') {
      this.initiateRazorpayPayment(payload);
      return;
    }

    this.submitOrder(payload);
  }

  private initiateRazorpayPayment(payload: any): void {
    this.api.post<any>('/storefront/payments/razorpay-order', { amount: this.grandTotal }).subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.toast.error('Failed to initiate payment');
          return;
        }

        // In dev/test mode with mock order, skip Razorpay checkout
        if (String(res.data.id).startsWith('mock_order_')) {
          this.submitOrder(payload);
          return;
        }

        const options: any = {
          key: environment.razorpayKey,
          amount: res.data.amount,
          currency: res.data.currency || 'INR',
          name: 'MySkin Store',
          description: `Order payment`,
          order_id: res.data.id,
          handler: (response: any) => {
            payload.razorpay_payment_id = response.razorpay_payment_id;
            payload.razorpay_order_id = response.razorpay_order_id;
            payload.razorpay_signature = response.razorpay_signature;
            this.submitOrder(payload);
          },
          modal: {
            ondismiss: () => {
              this.toast.error('Payment cancelled');
            },
          },
          theme: { color: '#8c6d3f' },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      },
      error: () => {
        this.toast.error('Failed to connect payment gateway. Please try again.');
      },
    });
  }

  applyCoupon(): void {
    if (!this.couponCode) return;
    this.couponApplied = true;
    this.couponMessage = 'Coupon applied!';
    this.couponSuccess = true;
  }

  private submitOrder(payload: any): void {
    this.orderService.placeOrder(payload).subscribe({
      next: (result: any) => {
        if (!this.buyNowItem) this.cart.clearCart();
        this.toast.success('Order placed successfully!');
        this.orderService.getOrderById(result.id).subscribe((order: any) => {
          if (order) {
            this.orderService.setLastOrder(order);
            this.router.navigate(['/checkout/success'], { state: { order } });
          }
        });
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to place order. Please try again.');
      },
    });
  }
}
