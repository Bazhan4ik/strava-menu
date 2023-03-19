import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemsRoutingModule } from './items-routing.module';
import { ItemsPage } from './items.page';
import { IonicModule } from '@ionic/angular';


@NgModule({
    declarations: [
        ItemsPage
    ],
    imports: [
        CommonModule,
        ItemsRoutingModule,
        IonicModule,
    ]
})
export class ItemsModule { }
