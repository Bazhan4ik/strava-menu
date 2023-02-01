import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddRestaurantRoutingModule } from './add-restaurant-routing.module';
import { AddRestaurantPage } from './add-restaurant.page';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [
    AddRestaurantPage,
  ],
  imports: [
    CommonModule,
    AddRestaurantRoutingModule,
    FormsModule,
    MatIconModule,
  ]
})
export class AddRestaurantModule { }
