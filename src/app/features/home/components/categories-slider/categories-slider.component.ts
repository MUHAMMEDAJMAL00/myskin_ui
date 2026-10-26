import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { resolveImageUrl } from '../../../../core/utils/image.util';

const COLLECTION_ART: { match: RegExp; src: string }[] = [
  { match: /foot/i, src: 'assets/bold/foot-washer.jpg' },
  { match: /kitchen/i, src: 'assets/bold/kitchen-mixers.jpg' },
  { match: /mixer|faucet|tap/i, src: 'assets/bold/mixer.jpg' },
  { match: /sanitary|closet|basin|toilet|wc/i, src: 'assets/bold/sanitary.jpg' },
  { match: /shower|spa/i, src: 'assets/bold/shower-systems.jpg' },
  { match: /shattaf|bidet|spray/i, src: 'assets/bold/bidet.jpg' },
  { match: /plumb|fitting|valve|trap|hose/i, src: 'assets/bold/plumbing.jpg' },
  { match: /heater|geyser/i, src: 'assets/bold/water-heater.jpg' },
  { match: /tile/i, src: 'assets/bold/bold-tile.jpg' },
  { match: /care|shampoo|conditioner|soap|gel|cosmetic|beauty/i, src: 'assets/bold/care-range.jpg' },
  { match: /vanity/i, src: 'assets/bold/basin-brass.jpg' },
];

@Component({
  standalone: false,
  selector: 'app-categories-slider',
  templateUrl: './categories-slider.component.html',
  styleUrl: './categories-slider.component.scss',
})
export class CategoriesSliderComponent implements OnInit {
  categories: Category[] = [];
  currentGroup = 0;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) =>
        (this.categories = categories
          .filter((c) => c.parent_id === null)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))),
      error: () => (this.categories = []),
    });
  }

  get groups(): Category[][] {
    const result: Category[][] = [];
    for (let i = 0; i < this.categories.length; i += 5) {
      result.push(this.categories.slice(i, i + 5));
    }
    return result;
  }

  prevGroup(): void {
    if (this.currentGroup > 0) this.currentGroup--;
  }

  nextGroup(): void {
    if (this.currentGroup < this.groups.length - 1) this.currentGroup++;
  }

  artFor(category: Category): string {
    if (category.image_url) return resolveImageUrl(category.image_url);
    const hit = COLLECTION_ART.find((entry) => entry.match.test(category.name));
    return hit ? hit.src : 'assets/bold/lifestyle-bath.jpg';
  }

  subtitleFor(category: Category): string {
    if (category.description) {
      const cleaned = category.description.replace(/<[^>]*>/g, '').trim();
      return cleaned.length > 80 ? cleaned.slice(0, 80) + '…' : cleaned;
    }
    const map: Record<string, string> = {
      'shower': 'Precision engineering',
      'mixer': 'Contemporary design',
      'faucet': 'Contemporary design',
      'sanitary': 'Pure porcelain',
      'basin': 'Pure porcelain',
      'closet': 'Pure porcelain',
      'foot': 'Patented wellbeing',
      'kitchen': 'Modern living',
      'tile': 'Artisan finish',
      'heater': 'Efficient warmth',
      'bidet': 'Hygiene refined',
      'shattaf': 'Hygiene refined',
      'vanity': 'Elegant storage',
      'care': 'Ritual essentials',
      'shampoo': 'Ritual essentials',
      'spa': 'Daily ritual',
    };
    for (const [key, val] of Object.entries(map)) {
      if (category.name.toLowerCase().includes(key)) return val;
    }
    return 'Curated collection';
  }

  indexLabel(i: number): string {
    return String(i + 1).padStart(2, '0');
  }
}
