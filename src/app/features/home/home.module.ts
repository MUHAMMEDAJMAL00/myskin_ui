import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './pages/home/home.component';
import { BannerComponent } from './components/banner/banner.component';
import { CategoriesSliderComponent } from './components/categories-slider/categories-slider.component';
import { TopProductsComponent } from './components/top-products/top-products.component';
import { TrendingComponent } from './components/trending/trending.component';
import { RecentlyViewedComponent } from './components/recently-viewed/recently-viewed.component';
import { ProjectsComponent } from './components/projects/projects.component';

@NgModule({
  declarations: [HomeComponent, BannerComponent, CategoriesSliderComponent, TopProductsComponent, TrendingComponent, RecentlyViewedComponent, ProjectsComponent],
  imports: [SharedModule, HomeRoutingModule],
})
export class HomeModule {}
