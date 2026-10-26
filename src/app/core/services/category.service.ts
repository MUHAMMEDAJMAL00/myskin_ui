import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private api: ApiService) {}

  /** Public, unauthenticated read of the same categories myskin_admin manages (see myskin_backend's storefront module). */
  getAll(): Observable<Category[]> {
    return this.api.getPaginated<Category>('/storefront/categories', { limit: 200 }).pipe(map((res) => res.data));
  }

  getTopLevel(): Observable<Category[]> {
    return this.getAll().pipe(map((categories) => categories.filter((c) => c.parent_id === null)));
  }

  getChildren(parentId: number): Observable<Category[]> {
    return this.getAll().pipe(map((categories) => categories.filter((c) => c.parent_id === parentId)));
  }

  getById(id: number): Observable<Category> {
    return this.api.get<Category>(`/storefront/categories/${id}`).pipe(map((res) => res.data));
  }
}
