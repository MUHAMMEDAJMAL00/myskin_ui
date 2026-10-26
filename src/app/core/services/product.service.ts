import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PaginatedResult } from '../models/api-response.model';
import { Product, ProductListParams } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: ApiService) {}

  /** Public, unauthenticated read of the same products myskin_admin manages (see myskin_backend's storefront module). */
  getProducts(params: ProductListParams = {}): Observable<PaginatedResult<Product>> {
    return this.api.getPaginated<Product>('/storefront/products', params);
  }

  getById(id: number): Observable<Product> {
    return this.api.get<Product>(`/storefront/products/${id}`).pipe(map((res) => res.data));
  }
}
