import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { MatIconModule } from '@angular/material/icon';
import { PopoverComponent } from './popover/popover.component';


@NgModule({
  declarations: [
    HomePage,
    PopoverComponent,
    PopoverComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    MatIconModule,
  ]
})
export class HomeModule { }
