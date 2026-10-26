import { Component, Input } from '@angular/core';

export type EmptyStateIcon = 'cart' | 'heart' | 'box' | 'search';

const ICON_CLASSES: Record<EmptyStateIcon, string> = {
  cart: 'bi-cart-x',
  heart: 'bi-heart',
  box: 'bi-box-seam',
  search: 'bi-search',
};

@Component({
  standalone: false,
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() icon: EmptyStateIcon = 'box';
  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel?: string;
  @Input() actionLink?: string;

  get iconClass(): string {
    return ICON_CLASSES[this.icon];
  }
}
