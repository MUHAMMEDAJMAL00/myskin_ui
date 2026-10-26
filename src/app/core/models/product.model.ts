export interface CategoryOption {
  id: number;
  name: string;
  slug?: string;
}

export interface ProductInventory {
  quantity: number;
  store_id: number;
  variant_id: number | null;
}

export interface ProductVariant {
  id: number;
  product_id?: number;
  variant_name: string;
  selling_price: string | number;
  mrp: string | number | null;
  purchase_price?: string | number;
  quantity?: string | number | null;
  unit?: string | null;
  sku?: string | null;
  image_url?: string | null;
}

export interface Product {
  id: number;
  store_id: number;
  category_id: number | null;
  name: string;
  sku: string;
  barcode: string | null;
  hsn_code: string | null;
  description: string | null;
  brand: string | null;
  unit_id: number | null;
  unit_value: string | null;
  purchase_price: string | number;
  selling_price: string | number;
  mrp: string | number | null;
  tax_rate: string | number;
  tax_included: number;
  image_url: string | null;
  is_active: number;
  is_new?: number;
  is_service: number;
  alert_quantity: number;
  max_quantity: number | null;
  createdAt?: string;
  Category?: CategoryOption | null;
  ProductInventories?: ProductInventory[];
  variants?: ProductVariant[];
  Discount?: DiscountInfo | null;
  OfferProducts?: { offer?: DiscountInfo | null }[];
}

export interface DiscountInfo {
  id: number;
  name: string;
  discount_type: string;
  discount_value: number | string;
  discount_value_type?: string;
  is_active?: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  category_id?: string | number;
}
