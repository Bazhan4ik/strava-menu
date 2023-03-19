import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditItemRoutingModule } from './edit-item-routing.module';
import { EditItemPage } from './edit-item.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TagInputModule } from 'ngx-chips';


@NgModule({
    declarations: [
        EditItemPage
    ],
    imports: [
        CommonModule,
        EditItemRoutingModule,
        MatIconModule,
        FormsModule,
        TagInputModule,
        ReactiveFormsModule,
    ]
})
export class EditItemModule { }
