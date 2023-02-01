import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddCollectionRoutingModule } from './add-collection-routing.module';
import { AddCollectionPage } from './add-collection.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        AddCollectionPage
    ],
    imports: [
        CommonModule,
        AddCollectionRoutingModule,
        MatIconModule,
        FormsModule,
    ]
})
export class AddCollectionModule { }
