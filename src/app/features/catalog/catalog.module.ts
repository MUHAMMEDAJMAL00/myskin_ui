import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CatalogRoutingModule } from './catalog-routing.module';
import { CategoryDetailComponent } from './pages/category-detail/category-detail.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { RelatedProductsComponent } from './components/related-products/related-products.component';

@NgModule({
  declarations: [CategoryDetailComponent, ProductDetailComponent, RelatedProductsComponent],
  imports: [SharedModule, CatalogRoutingModule],
})
export class CatalogModule {}
