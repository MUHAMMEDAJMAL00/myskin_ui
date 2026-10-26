import { Component, Input } from '@angular/core';
import { Category } from '../../../core/models/category.model';

@Component({
  standalone: false,
  selector: 'app-category-popover',
  templateUrl: './category-popover.component.html',
  styleUrl: './category-popover.component.scss',
})
export class CategoryPopoverComponent {
  @Input() categories: Category[] = [];
  @Input() titleImage?: string;
  @Input() extraText?: string;

  get leftItems(): Category[] {
    return this.categories.slice(0, Math.ceil(this.categories.length / 2));
  }

  get rightItems(): Category[] {
    return this.categories.slice(Math.ceil(this.categories.length / 2));
  }
}
