import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemRoutingModule } from './item-routing.module';
import { ItemPage } from './item.page';
import { MatIconModule } from '@angular/material/icon';
import { NgChartsModule } from 'ng2-charts';
import { IonicModule } from '@ionic/angular';


@NgModule({
    declarations: [
        ItemPage,
    ],
    imports: [
        CommonModule,
        ItemRoutingModule,
        MatIconModule,
        NgChartsModule,
        IonicModule,
    ]
})
export class ItemModule { }
