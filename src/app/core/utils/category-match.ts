import { Category } from '../models/category.model';

/** Finds the first category whose name contains any keyword (case-insensitive).
 *  Storefront sections are fixed in design but categories come from myskin_admin,
 *  so sections link by name rather than by hard-coded id. */
export function findCategoryByKeywords(categories: Category[], keywords: string[]): Category | undefined {
  const needles = keywords.map((k) => k.toLowerCase());
  return categories.find((c) => needles.some((n) => c.name.toLowerCase().includes(n)));
}
