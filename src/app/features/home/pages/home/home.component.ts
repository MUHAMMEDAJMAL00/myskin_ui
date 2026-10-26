import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { ProductService } from '../../../../core/services/product.service';
import { Category } from '../../../../core/models/category.model';
import { Product } from '../../../../core/models/product.model';
import { findCategoryByKeywords } from '../../../../core/utils/category-match';
import { resolveImageUrl } from '../../../../core/utils/image.util';
import {
  BRAND_CARDS,
  CATEGORY_TILES,
  CONNECT_PHOTOS,
  DEAL_CARDS,
  HERO_SLIDES,
  HomeLink,
  LUXE_CARDS,
  LUXE_PERKS,
  OFFER_STRIPS,
  PACK_CARDS,
  SOCIALS,
  STORY_LINKS,
  TRENDING,
  VALUE_FALLBACK,
} from '../../home-content';

interface CategoryView {
  name: string;
  image: string;
  categoryId?: number;
  link: HomeLink;
}

interface ValueView {
  name: string;
  price: string;
  image: string;
  productId?: number;
  link: HomeLink;
}

const HERO_INTERVAL_MS = 6000;

@Component({
  standalone: false,
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly heroSlides = HERO_SLIDES;
  readonly offers = OFFER_STRIPS;
  readonly deals = DEAL_CARDS;
  readonly packs = PACK_CARDS;
  readonly brands = BRAND_CARDS;
  readonly luxeCards = LUXE_CARDS;
  readonly luxePerks = LUXE_PERKS;
  readonly stories = STORY_LINKS;
  readonly trending = TRENDING;
  readonly connectPhotos = CONNECT_PHOTOS;
  readonly socials = SOCIALS;

  heroIndex = 0;
  categories: CategoryView[] = this.fallbackCategories();
  valueItems: ValueView[] = this.fallbackValueItems();

  private allCategories: Category[] = [];
  private heroTimer?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.allCategories = categories;
        const topLevel = categories.filter((c) => c.parent_id === null);
        if (topLevel.length) this.categories = topLevel.slice(0, 8).map((c) => this.toCategoryView(c));
      },
      error: () => (this.allCategories = []),
    });

    this.productService.getProducts({ limit: 12 }).subscribe({
      next: (res) => {
        if (res.data?.length) this.valueItems = this.toValueItems(res.data);
      },
      error: () => {},
    });

    this.startHeroTimer();
  }

  ngOnDestroy(): void {
    clearInterval(this.heroTimer);
  }

  goToSlide(index: number): void {
    this.heroIndex = index;
    this.startHeroTimer();
  }

  /** Category keywords resolve against live categories; anchors scroll on this page. */
  open(link: HomeLink): void {
    if (link.anchor) {
      document.getElementById(link.anchor)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const category = link.keywords ? findCategoryByKeywords(this.allCategories, link.keywords) : undefined;
    const target = category ?? this.allCategories.find((c) => c.parent_id === null);
    if (target) this.router.navigate(['/catalog', 'category', target.id]);
  }

  openCategory(item: CategoryView): void {
    if (item.categoryId) this.router.navigate(['/catalog', 'category', item.categoryId]);
    else this.open(item.link);
  }

  openValue(item: ValueView): void {
    if (item.productId) this.router.navigate(['/catalog', 'product', item.productId]);
    else this.open(item.link);
  }

  viewAllCategories(): void {
    this.open({ keywords: [] });
  }

  private startHeroTimer(): void {
    clearInterval(this.heroTimer);
    if (this.heroSlides.length < 2) return;
    this.heroTimer = setInterval(() => {
      this.heroIndex = (this.heroIndex + 1) % this.heroSlides.length;
    }, HERO_INTERVAL_MS);
  }

  private toCategoryView(category: Category): CategoryView {
    const fallback = findTileFor(category.name);
    return {
      name: category.name,
      image: category.image_url ? resolveImageUrl(category.image_url) : fallback.image,
      categoryId: category.id,
      link: {},
    };
  }

  private fallbackCategories(): CategoryView[] {
    return CATEGORY_TILES.map((tile) => ({ name: tile.name, image: tile.image, link: tile }));
  }

  private toValueItems(products: Product[]): ValueView[] {
    return products.map((product, i) => ({
      name: product.name,
      price: `Under ₹${roundUpPrice(Number(product.selling_price) || 0)}`,
      image: product.image_url ? resolveImageUrl(product.image_url) : VALUE_FALLBACK[i % VALUE_FALLBACK.length].image,
      productId: product.id,
      link: {},
    }));
  }

  private fallbackValueItems(): ValueView[] {
    return VALUE_FALLBACK.map((item) => ({ name: item.name, price: item.price, image: item.image, link: item }));
  }
}

/** Picks the stock tile whose keywords match a category name, else cycles by name length. */
function findTileFor(name: string) {
  const lower = name.toLowerCase();
  return (
    CATEGORY_TILES.find((tile) => tile.keywords?.some((k) => lower.includes(k))) ??
    CATEGORY_TILES[name.length % CATEGORY_TILES.length]
  );
}

/** "Under ₹X" label: next round 50 above the price. */
function roundUpPrice(price: number): number {
  return Math.max(50, Math.ceil((price + 1) / 50) * 50 - 1);
}
