import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TablesQrCodesRoutingModule } from './tables-qr-codes-routing.module';
import { MatIconModule } from '@angular/material/icon';
import { QRCodeModule } from 'angularx-qrcode';
import { TablesQrCodesPage } from './tables-qr-codes.page';
import { TableComponent } from './table/table.component';


@NgModule({
    declarations: [
        TablesQrCodesPage,
        TableComponent,
    ],
    imports: [
        CommonModule,
        TablesQrCodesRoutingModule,
        MatIconModule,        
        QRCodeModule,
    ]
})
export class TablesQrCodesModule { }
