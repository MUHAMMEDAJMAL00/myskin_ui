import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { MyOrdersComponent } from './pages/my-orders/my-orders.component';
import { WishlistComponent } from './pages/wishlist/wishlist.component';
import { AddressesComponent } from './pages/addresses/addresses.component';

const routes: Routes = [
  { path: 'my-orders', component: MyOrdersComponent, canActivate: [AuthGuard] },
  { path: 'addresses', component: AddressesComponent, canActivate: [AuthGuard] },
  { path: 'wishlist', component: WishlistComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
