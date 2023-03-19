import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagInputModule } from 'ngx-chips';
import { AddItemRoutingModule } from './add-item-routing.module';
import { AddItemPage } from './add-item.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        AddItemPage,
    ],
    imports: [
        CommonModule,
        AddItemRoutingModule,
        MatIconModule,
        TagInputModule,
        FormsModule,
        ReactiveFormsModule
    ]
})
export class AddItemModule { }
