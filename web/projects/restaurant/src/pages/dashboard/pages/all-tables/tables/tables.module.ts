import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TablesRoutingModule } from './tables-routing.module';
import { TablesPage } from './tables.page';
import { MatIconModule } from '@angular/material/icon';
import { QRCodeModule } from 'angularx-qrcode';


@NgModule({
    declarations: [
        TablesPage,
    ],
    imports: [
        CommonModule,
        TablesRoutingModule,
        MatIconModule,
        QRCodeModule,
    ]
})
export class TablesModule { }
