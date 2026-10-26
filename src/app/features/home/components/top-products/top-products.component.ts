import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  standalone: false,
  selector: 'app-top-products',
  templateUrl: './top-products.component.html',
  styleUrl: './top-products.component.scss',
})
export class TopProductsComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  skeletonItems = Array.from({ length: 8 });

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getProducts({ limit: 8, page: 1 }).subscribe({
      next: (res) => {
        this.products = res.data;
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.loading = false;
      },
    });
  }
}
