import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditDishRoutingModule } from './edit-dish-routing.module';
import { EditDishPage } from './edit-dish.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TagInputModule } from 'ngx-chips';


@NgModule({
    declarations: [
        EditDishPage
    ],
    imports: [
        CommonModule,
        EditDishRoutingModule,
        MatIconModule,
        FormsModule,
        TagInputModule,
        ReactiveFormsModule,
    ]
})
export class EditDishModule { }
