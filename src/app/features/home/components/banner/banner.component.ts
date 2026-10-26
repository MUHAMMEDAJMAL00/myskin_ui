import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

interface Slide {
  label: string;
  title: string;
  titleEm: string;
  sub: string;
  ctaLabel: string;
  ghostLabel: string;
  ghostLink: string;
}

@Component({
  standalone: false,
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class BannerComponent implements OnInit, OnDestroy {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;

  slides: Slide[] = [
    {
      label: 'Maison de Bain — Dubai',
      title: 'Where Water',
      titleEm: 'Gold',
      sub: 'Bathware composed in Dubai for those who treat the everyday as ceremony — sanitaryware, mixers and showers of quiet distinction.',
      ctaLabel: 'Explore the Collections',
      ghostLabel: 'The Maison',
      ghostLink: '/about',
    },
    {
      label: 'Artisanal Craft',
      title: 'Designed in',
      titleEm: 'Dubai',
      sub: 'Every piece is conceived in our atelier with natural materials, finished by hand, and perfected for a lifetime of quiet service.',
      ctaLabel: 'Discover Our Process',
      ghostLabel: 'View Materials',
      ghostLink: '/about',
    },
    {
      label: 'The Ritual of Water',
      title: 'Water, Reimagined',
      titleEm: 'for wellness',
      sub: 'From the Foot Washer to the Care Collection — every creation restores grace to your daily ceremony.',
      ctaLabel: 'Explore the Care Line',
      ghostLabel: 'Wellness Philosophy',
      ghostLink: '/about',
    },
  ];

  currentIndex = 0;
  animating = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngAfterViewInit(): void {
    const video = this.heroVideo?.nativeElement;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.loop = true;
    video.play().catch(() => {
      const play = () => {
        video.muted = true;
        video.volume = 0;
        video.play();
        document.removeEventListener('click', play);
        document.removeEventListener('touchstart', play);
      };
      document.addEventListener('click', play);
      document.addEventListener('touchstart', play);
    });
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  next(): void {
    if (this.animating) return;
    this.animating = true;
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    setTimeout(() => (this.animating = false), 2000);
    this.resetAutoSlide();
  }

  prev(): void {
    if (this.animating) return;
    this.animating = true;
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    setTimeout(() => (this.animating = false), 2000);
    this.resetAutoSlide();
  }

  goTo(index: number): void {
    if (this.animating || index === this.currentIndex) return;
    this.animating = true;
    this.currentIndex = index;
    setTimeout(() => (this.animating = false), 2000);
    this.resetAutoSlide();
  }

  trackIndex(i: number): number {
    return (i - this.currentIndex + this.slides.length) % this.slides.length;
  }

  scrollToCollections(): void {
    document
      .getElementById('section-collections')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private startAutoSlide(): void {
    this.intervalId = setInterval(() => this.next(), 8000);
  }

  private stopAutoSlide(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private resetAutoSlide(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }
}
