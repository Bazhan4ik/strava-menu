import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerLayoutRoutingModule } from './customer-layout-routing.module';
import { CustomerLayoutPage } from './customer-layout.page';
import { MatIconModule } from '@angular/material/icon';
import { CollectionComponent } from './components/collection/collection.component';
import { FolderComponent } from './components/folder/folder.component';


@NgModule({
    declarations: [
        CustomerLayoutPage,
        CollectionComponent,
        FolderComponent,
    ],
    imports: [
        CommonModule,
        CustomerLayoutRoutingModule,
        MatIconModule,
    ]
})
export class CustomerLayoutModule { }
