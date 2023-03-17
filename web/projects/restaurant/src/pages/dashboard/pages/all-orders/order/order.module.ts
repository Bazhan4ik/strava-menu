import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderRoutingModule } from './order-routing.module';
import { OrderPage } from './order.page';
import { MatIconModule } from '@angular/material/icon';
import { TimelineComponent } from './timeline/timeline.component';


@NgModule({
    declarations: [OrderPage, TimelineComponent],
    imports: [
        CommonModule,
        OrderRoutingModule,
        MatIconModule,
    ]
})
export class OrderModule { }
