import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CartRoutingModule } from './cart-routing.module';
import { CartComponent } from './pages/cart/cart.component';

@NgModule({
  declarations: [CartComponent],
  imports: [SharedModule, CartRoutingModule],
})
export class CartModule {}
