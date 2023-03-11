import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DishRoutingModule } from './dish-routing.module';
import { DishPage } from './dish.page';
import { MatIconModule } from '@angular/material/icon';
import { NgChartsModule } from 'ng2-charts';
import { IonicModule } from '@ionic/angular';


@NgModule({
    declarations: [
        DishPage,
    ],
    imports: [
        CommonModule,
        DishRoutingModule,
        MatIconModule,
        NgChartsModule,
        IonicModule,
    ]
})
export class DishModule { }
