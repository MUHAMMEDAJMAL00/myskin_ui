import { Product } from './product.model';

export interface WishlistItem {
  _id: string;
  product: Product;
  price: number;
  variantId?: number | null;
  variantName?: string | null;
}
