import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IngredientRoutingModule } from './ingredient-routing.module';
import { IngredientPage } from './ingredient.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        IngredientPage,
    ],
    imports: [
        CommonModule,
        MatIconModule,
        IngredientRoutingModule,
        FormsModule,
    ]
})
export class IngredientModule { }
