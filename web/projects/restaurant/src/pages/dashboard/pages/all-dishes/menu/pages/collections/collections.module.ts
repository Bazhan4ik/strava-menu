import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CollectionsRoutingModule } from './collections-routing.module';
import { CollectionsPage } from './collections.page';


@NgModule({
    declarations: [
        CollectionsPage
    ],
    imports: [
        CommonModule,
        CollectionsRoutingModule
    ]
})
export class CollectionsModule { }
