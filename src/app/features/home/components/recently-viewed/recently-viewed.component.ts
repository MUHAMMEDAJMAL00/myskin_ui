import { Component, OnInit } from '@angular/core';
import { RecentlyViewedService } from '../../../../core/services/recently-viewed.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  standalone: false,
  selector: 'app-recently-viewed',
  templateUrl: './recently-viewed.component.html',
  styleUrl: './recently-viewed.component.scss',
})
export class RecentlyViewedComponent implements OnInit {
  products: Product[] = [];

  constructor(private service: RecentlyViewedService) {}

  ngOnInit(): void {
    this.service.items$.subscribe((items) => (this.products = items));
  }
}
