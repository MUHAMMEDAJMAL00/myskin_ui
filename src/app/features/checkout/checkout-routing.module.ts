import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { SuccessComponent } from './pages/success/success.component';
import { ReturnComponent } from './pages/return/return.component';

const routes: Routes = [
  { path: '', component: CheckoutComponent, canActivate: [AuthGuard] },
  { path: 'success', component: SuccessComponent, canActivate: [AuthGuard] },
  { path: 'return', component: ReturnComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CheckoutRoutingModule {}
