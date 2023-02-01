import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CollectionRoutingModule } from './collection-routing.module';
import { CollectionPage } from './collection.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        CollectionPage,
    ],
    imports: [
        CommonModule,
        CollectionRoutingModule,
        MatIconModule,
    ]
})
export class CollectionModule { }
