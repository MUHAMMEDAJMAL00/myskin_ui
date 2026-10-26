import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AccountRoutingModule } from './account-routing.module';
import { MyOrdersComponent } from './pages/my-orders/my-orders.component';
import { WishlistComponent } from './pages/wishlist/wishlist.component';
import { AddressesComponent } from './pages/addresses/addresses.component';
import { UserSidebarComponent } from './components/user-sidebar/user-sidebar.component';

@NgModule({
  declarations: [MyOrdersComponent, WishlistComponent, AddressesComponent, UserSidebarComponent],
  imports: [SharedModule, AccountRoutingModule],
})
export class AccountModule {}
