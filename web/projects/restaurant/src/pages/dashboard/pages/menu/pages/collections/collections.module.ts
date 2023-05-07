import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { CollectionsRoutingModule } from './collections-routing.module';
import { CollectionsPage } from './collections.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        CollectionsPage,
    ],
    imports: [
        CommonModule,
        CollectionsRoutingModule,
        MatIconModule,
        NgOptimizedImage,
    ]
})
export class CollectionsModule { }
