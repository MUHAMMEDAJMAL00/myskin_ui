import { Component, Input } from '@angular/core';

export type SkeletonVariant = 'card' | 'text' | 'circle' | 'image';

@Component({
  standalone: false,
  selector: 'app-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width?: string;
  @Input() height?: string;
}
