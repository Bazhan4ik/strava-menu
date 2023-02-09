import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersPage } from './customers.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        CustomersPage,
    ],
    imports: [
        CommonModule,
        CustomersRoutingModule,
        MatIconModule,
    ]
})
export class CustomersModule { }
