import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { SuccessComponent } from './pages/success/success.component';
import { ReturnComponent } from './pages/return/return.component';

@NgModule({
  declarations: [CheckoutComponent, SuccessComponent, ReturnComponent],
  imports: [SharedModule, CheckoutRoutingModule],
})
export class CheckoutModule {}
