import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { findCategoryByKeywords } from '../../../core/utils/category-match';

interface NavItem {
  label: string;
  /** Category name keywords; an empty list means "first category". */
  keywords?: string[];
  /** Section id on the home page. */
  anchor?: string;
}

@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly navItems: NavItem[] = [
    { label: 'Home' },
    { label: 'Shop', keywords: [] },
    { label: 'Makeup', keywords: ['makeup', 'make up', 'cosmetic'] },
    { label: 'Skincare', keywords: ['skin'] },
    { label: 'Hair', keywords: ['hair'] },
    { label: 'Fragrance', keywords: ['fragrance', 'perfume'] },
    { label: 'Bath & Body', keywords: ['bath', 'body'] },
    { label: 'Brands', anchor: 'brands' },
    { label: 'Community', anchor: 'community' },
  ];

  topLevelCategories: Category[] = [];
  private allCategories: Category[] = [];
  cartCount = 0;
  wishlistCount = 0;
  expandedCategoryId: number | null = null;
  activeCategoryId: number | null = null;
  searchTerm = '';
  private currentUrl = '/';

  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    public auth: AuthService,
    private cart: CartService,
    private wishlist: WishlistService,
    private categoryService: CategoryService,
    private offcanvas: NgbOffcanvas,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.categoryService.getAll().subscribe({
        next: (categories) => {
          this.allCategories = categories;
          this.topLevelCategories = categories.filter((c) => c.parent_id === null);
        },
        error: () => {
          this.allCategories = [];
          this.topLevelCategories = [];
        },
      }),
    );

    this.subscriptions.add(this.cart.cartItems$.subscribe((items) => (this.cartCount = items.length)));
    this.subscriptions.add(this.wishlist.items$.subscribe((items) => (this.wishlistCount = items.length)));

    this.updateActiveCategory(this.router.url);
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => this.updateActiveCategory(event.urlAfterRedirects)),
    );
  }

  private updateActiveCategory(url: string): void {
    this.currentUrl = url;
    const match = url.match(/\/catalog\/category\/(\d+)/);
    this.activeCategoryId = match ? Number(match[1]) : null;
  }

  private categoryFor(item: NavItem): Category | undefined {
    if (!item.keywords) return undefined;
    if (!item.keywords.length) return this.topLevelCategories[0];
    return findCategoryByKeywords(this.allCategories, item.keywords);
  }

  isNavActive(item: NavItem): boolean {
    if (item.label === 'Home') return this.currentUrl === '/' || this.currentUrl.startsWith('/#');
    if (!item.keywords?.length) return false;
    const category = this.categoryFor(item);
    return !!category && this.isCategoryActive(category.id);
  }

  navigate(item: NavItem, close?: () => void): void {
    close?.();
    if (item.anchor) {
      this.router.navigate(['/'], { fragment: item.anchor });
      return;
    }
    const category = this.categoryFor(item);
    if (category) {
      this.navigateToCategory(category.id);
      return;
    }
    this.router.navigate(['/']);
  }

  search(close?: () => void): void {
    const term = this.searchTerm.trim();
    const target = this.topLevelCategories[0];
    if (!term || !target) return;
    close?.();
    this.router.navigate(['/catalog', 'category', target.id], { queryParams: { search: term } });
  }

  isCategoryActive(masterId: number): boolean {
    if (this.activeCategoryId === null) return false;
    if (masterId === this.activeCategoryId) return true;
    return this.childrenOf(masterId).some((child) => child.id === this.activeCategoryId);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  childrenOf(categoryId: number): Category[] {
    return this.allCategories.filter((c) => c.parent_id === categoryId);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToMyOrders(): void {
    this.router.navigate(['/my-orders']);
  }

  openMobileMenu(content: unknown): void {
    this.offcanvas.open(content, { position: 'start' });
  }

  toggleExpanded(categoryId: number): void {
    this.expandedCategoryId = this.expandedCategoryId === categoryId ? null : categoryId;
  }

  navigateToCategory(categoryId: number, close?: () => void): void {
    close?.();
    this.expandedCategoryId = null;
    this.router.navigate(['/catalog', 'category', categoryId]);
  }
}
