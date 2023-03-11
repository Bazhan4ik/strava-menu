import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DishesRoutingModule } from './dishes-routing.module';
import { DishesPage } from './dishes.page';
import { IonicModule } from '@ionic/angular';


@NgModule({
    declarations: [
        DishesPage
    ],
    imports: [
        CommonModule,
        DishesRoutingModule,
        IonicModule,
    ]
})
export class DishesModule { }
