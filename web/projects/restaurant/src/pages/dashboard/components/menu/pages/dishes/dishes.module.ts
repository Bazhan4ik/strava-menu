import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DishesRoutingModule } from './dishes-routing.module';
import { DishesPage } from './dishes.page';


@NgModule({
    declarations: [
        DishesPage
    ],
    imports: [
        CommonModule,
        DishesRoutingModule
    ]
})
export class DishesModule { }
