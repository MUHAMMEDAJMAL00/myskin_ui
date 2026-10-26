import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OceanSceneComponent } from './ocean-scene.component';
import { OceanRoutingModule } from './ocean-routing.module';

@NgModule({
  declarations: [OceanSceneComponent],
  imports: [CommonModule, OceanRoutingModule],
})
export class OceanModule {}
