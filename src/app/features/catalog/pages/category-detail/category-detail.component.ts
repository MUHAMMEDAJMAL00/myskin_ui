import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { ProductService } from '../../../../core/services/product.service';
import { RecentlyViewedService } from '../../../../core/services/recently-viewed.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Category } from '../../../../core/models/category.model';
import { Product } from '../../../../core/models/product.model';

@Component({
  standalone: false,
  selector: 'app-category-detail',
  templateUrl: './category-detail.component.html',
  styleUrl: './category-detail.component.scss',
})
export class CategoryDetailComponent implements OnInit {
  categoryId!: number;
  categories: Category[] = [];
  products: Product[] = [];
  page = 1;
  totalPages = 1;
  searchTerm = '';
  sortOrder: '' | 'asc' | 'desc' = '';
  sortField: 'price' | 'name' | 'newest' = 'price';
  sidebarOpen = false;
  isMobile = window.innerWidth < 800;
  loading = true;
  skeletonItems = Array.from({ length: 8 });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private productService: ProductService,
    private recentlyViewed: RecentlyViewedService,
    private wishlist: WishlistService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => (this.categories = []),
    });

    this.route.paramMap.subscribe((params) => {
      this.categoryId = Number(params.get('categoryId'));
      this.page = 1;
      this.searchTerm = '';
      this.loadProducts();
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 800;
  }

  loadProducts(): void {
    this.loading = true;
    const params: any = { category_id: this.categoryId, page: this.page, limit: 8 };
    if (this.searchTerm.trim()) params.search = this.searchTerm.trim();
    this.productService.getProducts(params).subscribe({
      next: (res) => {
        this.products = this.applySort(res.data);
        this.totalPages = res.total_pages || 1;
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.totalPages = 1;
        this.loading = false;
      },
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.page = 1;
    this.loadProducts();
  }

  onSortChange(value: string): void {
    const parts = value.split('|');
    this.sortField = (parts[0] || 'price') as 'price' | 'name' | 'newest';
    this.sortOrder = (parts[1] || '') as '' | 'asc' | 'desc';
    this.products = this.applySort([...this.products]);
  }

  private applySort(products: Product[]): Product[] {
    if (!this.sortOrder) return products;
    const sorted = [...products].sort((a, b) => {
      if (this.sortField === 'name') return a.name.localeCompare(b.name);
      if (this.sortField === 'newest') return (b.id || 0) - (a.id || 0);
      return Number(a.selling_price) - Number(b.selling_price);
    });
    return this.sortOrder === 'asc' ? sorted : sorted.reverse();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadProducts();
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get currentCategory(): Category | undefined {
    return this.categories.find((c) => c.id === this.categoryId);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    if (this.isMobile) this.sidebarOpen = false;
  }

  prevPage(): void {
    if (this.page > 1) this.goToPage(this.page - 1);
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.goToPage(this.page + 1);
  }

  addToWishlist(product: Product): void {
    if (this.wishlist.isWishlisted(product.id)) {
      this.toast.info('Already in your wishlist.');
      return;
    }
    this.wishlist.add(product);
    this.toast.success('Added to wishlist!');
  }

  onProductClick(product: Product): void {
    this.recentlyViewed.add(product);
  }

  scrollToProducts(): void {
    document.querySelector('.pl-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  get totalProducts(): number {
    return this.products.length;
  }
}
