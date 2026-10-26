import { Product } from './product.model';

export interface CartItem {
  _id: string;
  product: Product;
  variantId?: number | null;
  variantName?: string | null;
  quantity: number;
  price: number;
}
