import { Component, AfterViewInit, ViewChild, ElementRef, OnInit } from '@angular/core';

interface Spotlight {
  label: string;
  title: string;
  titleEm: string;
  description: string;
  note: string;
  image: string;
  link: string;
}

@Component({
  standalone: false,
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('careVideo') careVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('quoteVideo') quoteVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('valuesSection') valuesRef!: ElementRef<HTMLElement>;

  spotlights: Spotlight[] = [
    {
      label: 'A World First',
      title: 'The Foot Washer,',
      titleEm: 'patented for wellbeing',
      description: 'The first of its kind in the world, the fully patented BOLD Foot Washer restores grace to a daily ritual — conceived for every generation, from the young to the elderly and expectant mothers.',
      note: 'Design, innovation and holistic wellbeing, ingrained as part of the Maison\'s ethos.',
      image: 'assets/bold/foot-washer.jpeg',
      link: '/about',
    },
    {
      label: 'The Cascade Mixer',
      title: 'Water in',
      titleEm: 'pure form',
      description: 'The Cascade basin mixer transforms the everyday gesture into a quiet ritual. Brushed gold finish, precision-engineered flow, and a silhouette that honours the Maison\'s design language.',
      note: 'Hand-finished in Dubai. Available in brushed brass, matte black, and polished nickel.',
      image: 'assets/bold/mixer.jpg',
      link: '/catalog/category/1',
    },
    {
      label: 'Marbre Vessel Basin',
      title: 'Sculpted from',
      titleEm: 'natural stone',
      description: 'Each Marbre basin is carved from a single block of natural marble — no two pieces are alike. A vessel that brings the permanence of stone into the daily ceremony of water.',
      note: 'Available in Carrara, Calacatta, and Nero Marquina marble.',
      image: 'assets/bold/prod-marbre-vessel-basin.jpg',
      link: '/catalog/category/1',
    },
    {
      label: 'The Foot Washer',
      title: 'Designed for',
      titleEm: 'every generation',
      description: 'From the young to the elderly and expectant mothers — the patented BOLD Foot Washer brings comfort, safety, and grace to a daily ritual, honoured as a World First innovation.',
      note: 'Conceived in Dubai, patented globally.',
      image: 'assets/bold/foot-washer.jpeg',
      link: '/about',
    },
  ];

  currentSpotlight!: Spotlight;
  valuesVisible = false;

  ngOnInit(): void {
    this.currentSpotlight = this.spotlights[Math.floor(Math.random() * this.spotlights.length)];

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = 'assets/bold/care-ritual.mp4';
    document.head.appendChild(link);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      document.querySelectorAll('video').forEach((v) => {
        v.muted = true;
        v.defaultMuted = true;
        v.volume = 0;
        v.play().catch(() => {});
      });
    }, 200);

    const valuesEl = this.valuesRef?.nativeElement;
    if (valuesEl) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.valuesVisible = true;
            observer.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(valuesEl);
    }
  }
}
