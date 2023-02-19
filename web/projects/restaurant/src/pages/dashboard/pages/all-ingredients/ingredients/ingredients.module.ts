import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IngredientsRoutingModule } from './ingredients-routing.module';
import { IngredientsPage } from './ingredients.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        IngredientsPage,
    ],
    imports: [
        CommonModule,
        MatIconModule,
        IngredientsRoutingModule
    ]
})
export class IngredientsModule { }
