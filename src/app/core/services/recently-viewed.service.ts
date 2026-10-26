import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

const KEY = 'myskin_web_recent';

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  private itemsSubject = new BehaviorSubject<Product[]>(this.read());
  items$ = this.itemsSubject.asObservable();

  get items(): Product[] {
    return this.itemsSubject.value;
  }

  add(product: Product): void {
    let list = this.items.filter((p) => p.id !== product.id);
    list.unshift(product);
    if (list.length > 12) list = list.slice(0, 12);
    this.persist(list);
  }

  private persist(items: Product[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  private read(): Product[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch { return []; }
  }
}
