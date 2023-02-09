import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersRoutingModule } from './orders-routing.module';
import { MatIconModule } from '@angular/material/icon';
import { OrdersPage } from './orders.page';


@NgModule({
    declarations: [
        OrdersPage,
    ],
    imports: [
        CommonModule,
        OrdersRoutingModule,
        MatIconModule,
    ]
})
export class OrdersModule { }
