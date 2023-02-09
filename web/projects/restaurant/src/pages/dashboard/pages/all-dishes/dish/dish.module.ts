import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DishRoutingModule } from './dish-routing.module';
import { DishPage } from './dish.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        DishPage,
    ],
    imports: [
        CommonModule,
        DishRoutingModule,
        MatIconModule,
    ]
})
export class DishModule { }
