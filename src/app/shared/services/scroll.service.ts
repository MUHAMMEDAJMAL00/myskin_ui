import { Injectable } from '@angular/core';

const SECTION_IDS: Record<string, string> = {
  banner: 'section-banner',
  categories: 'section-categories',
  top: 'section-top',
  trending: 'section-trending',
};

@Injectable({ providedIn: 'root' })
export class ScrollService {
  scrollTo(sectionName: string): void {
    const id = SECTION_IDS[sectionName];
    const element = id ? document.getElementById(id) : null;
    if (!element) return;

    const yOffset = -120;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}
