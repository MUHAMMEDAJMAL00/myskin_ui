import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./features/home/home.module').then((m) => m.HomeModule) },
  { path: '', loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule) },
  { path: 'catalog', loadChildren: () => import('./features/catalog/catalog.module').then((m) => m.CatalogModule) },
  { path: 'cart', loadChildren: () => import('./features/cart/cart.module').then((m) => m.CartModule) },
  { path: 'checkout', loadChildren: () => import('./features/checkout/checkout.module').then((m) => m.CheckoutModule) },
  { path: '', loadChildren: () => import('./features/account/account.module').then((m) => m.AccountModule) },
  { path: 'about', loadChildren: () => import('./features/about/about.module').then((m) => m.AboutModule) },
  { path: 'ocean', loadChildren: () => import('./features/ocean/ocean.module').then((m) => m.OceanModule) },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
