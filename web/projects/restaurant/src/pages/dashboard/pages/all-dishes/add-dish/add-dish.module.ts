import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagInputModule } from 'ngx-chips';
import { AddDishRoutingModule } from './add-dish-routing.module';
import { AddDishPage } from './add-dish.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        AddDishPage,
    ],
    imports: [
        CommonModule,
        AddDishRoutingModule,
        MatIconModule,
        TagInputModule,
        FormsModule,
        ReactiveFormsModule
    ]
})
export class AddDishModule { }
