import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditCollectionRoutingModule } from './edit-collection-routing.module';
import { EditCollectionPage } from './edit-collection.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        EditCollectionPage
    ],
    imports: [
        CommonModule,
        EditCollectionRoutingModule,
        MatIconModule,
        FormsModule
    ]
})
export class EditCollectionModule { }
