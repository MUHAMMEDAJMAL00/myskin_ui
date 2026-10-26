import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbOffcanvasModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CategoryPopoverComponent } from './components/category-popover/category-popover.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { SkeletonComponent } from './components/skeleton/skeleton.component';
import { BubblesCanvasComponent } from './components/bubbles-canvas/bubbles-canvas.component';
import { DripCanvasComponent } from './components/drip-canvas/drip-canvas.component';
import { ImageUrlPipe } from './pipes/image-url.pipe';

const SHARED_MEMBERS = [
  HeaderComponent,
  FooterComponent,
  CategoryPopoverComponent,
  CarouselComponent,
  ToastContainerComponent,
  ProductCardComponent,
  EmptyStateComponent,
  SkeletonComponent,
  BubblesCanvasComponent,
  DripCanvasComponent,
  ImageUrlPipe,
];

@NgModule({
  declarations: [...SHARED_MEMBERS],
  imports: [CommonModule, FormsModule, RouterModule, NgbDropdownModule, NgbOffcanvasModule, NgbPopoverModule],
  exports: [CommonModule, FormsModule, RouterModule, ...SHARED_MEMBERS],
})
export class SharedModule {}
