export interface OrderItem {
  id?: number;
  product_id: number;
  variant_id?: number | null;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  purchase_price?: number;

  name?: string;
  productId?: number;
  qty?: number;
  price?: number;
  image?: string;
  mrp?: number;
  taxRate?: number;
  taxIncluded?: number;
  discount?: number;
  taxAmount?: number;
  lineTotal?: number;
}

export interface SalePayment {
  id?: number;
  payment_method: string;
  payment_source_name?: string | null;
  amount: number;
}

export interface Order {
  id: number;
  invoice_number: string;
  customer_id: number;
  store_id: number;
  status: string;
  source: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_charge: number;
  round_off?: number;
  total_amount: number;
  total_cost?: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  notes: string | null;
  created_at: string;
  sale_date: string;
  items: OrderItem[];
  payments: SalePayment[];
  Customer?: { id: number; name: string; phone: string } | null;

  _id?: string;
  user?: string;
  address?: any;
  paymentMethod?: string;
  discountTotal?: number;
  taxTotal?: number;
  deliveryCharges?: number;
  totalPrice?: number;
  createdAt?: string;
  payment_method?: string;
}

export interface SaleResponse {
  id: number;
  invoice_number: string;
  total_amount: number;
  status: string;
  source: string;
  items_count: number;
}
