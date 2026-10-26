import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  standalone: false,
  selector: 'app-trending',
  templateUrl: './trending.component.html',
  styleUrl: './trending.component.scss',
})
export class TrendingComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  skeletonItems = Array.from({ length: 8 });

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getProducts({ limit: 8, page: 2 }).subscribe({
      next: (res) => {
        this.products = res.data.length ? res.data : [];
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.loading = false;
      },
    });
  }
}
