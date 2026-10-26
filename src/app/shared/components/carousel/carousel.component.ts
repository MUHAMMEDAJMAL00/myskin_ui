import {
  AfterContentInit,
  Component,
  ContentChild,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  TemplateRef,
} from '@angular/core';

export interface CarouselBreakpoint {
  breakpoint: number;
  slidesToShow: number;
  slidesToScroll?: number;
}

export interface CarouselConfig {
  slidesToShow: number;
  slidesToScroll?: number;
  autoplay?: boolean;
  speed?: number;
  dots?: boolean;
  arrows?: boolean;
  responsive?: CarouselBreakpoint[];
  /** Horizontal gutter between slides, in px. Defaults to 8. Use 0 for full-bleed single-slide carousels (e.g. a hero banner). */
  gutter?: number;
  /** Enable 3D perspective rotation effect on slide change */
  effect3d?: boolean;
}

@Component({
  standalone: false,
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
})
export class CarouselComponent implements AfterContentInit, OnChanges, OnDestroy {
  @Input() items: unknown[] = [];
  @Input() config: CarouselConfig = { slidesToShow: 1 };
  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<{ $implicit: unknown; index: number }>;

  currentIndex = 0;
  prevIndex = -1;
  private autoplayHandle?: ReturnType<typeof setInterval>;

  ngAfterContentInit(): void {
    this.startAutoplay();
  }

  ngOnChanges(): void {
    if (this.currentIndex > this.maxIndex) this.currentIndex = 0;
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  @HostListener('window:resize')
  onResize(): void {
    // Triggers re-render of the responsive getter; nothing to compute here.
  }

  get slidesToShow(): number {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const sorted = [...(this.config.responsive ?? [])].sort((a, b) => a.breakpoint - b.breakpoint);
    const match = sorted.find((bp) => width <= bp.breakpoint);
    return match ? match.slidesToShow : this.config.slidesToShow;
  }

  get slidesToScroll(): number {
    return this.config.slidesToScroll ?? 1;
  }

  get slideWidthPercent(): number {
    return 100 / this.slidesToShow;
  }

  get gutter(): number {
    return this.config.gutter ?? 8;
  }

  get trackTransform(): string {
    if (this.config.effect3d && this.slidesToShow === 1) {
      return `translateX(-${this.currentIndex * 100}%)`;
    }
    return `translateX(-${this.currentIndex * this.slideWidthPercent}%)`;
  }

  /**
   * Furthest the track can scroll before the last slide would leave blank space at the end.
   * Floored so currentIndex always lands on a whole slide boundary — slidesToShow is often
   * fractional (deliberate "peek" of the next card), and resting at a fractional index would
   * cut the leading slide in half instead of just letting the trailing slide peek.
   */
  private get maxIndex(): number {
    return Math.max(0, Math.floor(this.items.length - this.slidesToShow));
  }

  get dotCount(): number {
    return Math.max(1, Math.ceil(this.items.length / this.slidesToScroll));
  }

  get dots(): number[] {
    return Array.from({ length: this.dotCount }, (_, i) => i);
  }

  get activeDot(): number {
    return Math.round(this.currentIndex / this.slidesToScroll);
  }

  goToDot(dot: number): void {
    this.prevIndex = this.currentIndex;
    this.currentIndex = Math.min(dot * this.slidesToScroll, this.maxIndex);
  }

  next(): void {
    const upcoming = this.currentIndex - this.slidesToScroll;
    this.prevIndex = this.currentIndex;
    this.currentIndex = upcoming < 0 ? this.maxIndex : upcoming;
  }

  prev(): void {
    if (this.currentIndex >= this.maxIndex) {
      this.prevIndex = this.currentIndex;
      this.currentIndex = 0;
      return;
    }
    this.prevIndex = this.currentIndex;
    this.currentIndex = Math.min(this.currentIndex + this.slidesToScroll, this.maxIndex);
  }

  private startAutoplay(): void {
    if (!this.config.autoplay) return;
    this.autoplayHandle = setInterval(() => this.next(), this.config.speed ?? 3000);
  }

  private stopAutoplay(): void {
    if (this.autoplayHandle) clearInterval(this.autoplayHandle);
  }
}
