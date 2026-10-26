import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  standalone: false,
  selector: 'app-related-products',
  templateUrl: './related-products.component.html',
  styleUrl: './related-products.component.scss',
})
export class RelatedProductsComponent implements OnInit {
  @Input() product!: Product;
  products: Product[] = [];
  loading = true;

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    if (!this.product.category_id) { this.loading = false; return; }
    this.productService.getProducts({ category_id: this.product.category_id, limit: 5 }).subscribe({
      next: (res) => {
        this.products = res.data.filter((p) => p.id !== this.product.id).slice(0, 4);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/catalog', 'product', productId]);
  }
}
