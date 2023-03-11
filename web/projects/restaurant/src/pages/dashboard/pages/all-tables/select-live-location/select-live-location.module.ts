import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SelectLiveLocationRoutingModule } from './select-live-location-routing.module';
import { SelectLiveLocationPage } from './select-live-location.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        SelectLiveLocationPage
    ],
    imports: [
        CommonModule,
        SelectLiveLocationRoutingModule,
        MatIconModule,
    ]
})
export class SelectLiveLocationModule { }
