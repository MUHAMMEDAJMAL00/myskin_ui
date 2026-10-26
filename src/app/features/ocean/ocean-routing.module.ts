import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OceanSceneComponent } from './ocean-scene.component';

const routes: Routes = [{ path: '', component: OceanSceneComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OceanRoutingModule {}
