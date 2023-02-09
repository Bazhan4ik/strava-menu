import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddLocationRoutingModule } from './add-location-routing.module';
import { AddLocationPage } from './add-location.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';


@NgModule({
    declarations: [
        AddLocationPage,
    ],
    imports: [
        CommonModule,
        MatIconModule,
        AddLocationRoutingModule,
        FormsModule,
        GoogleMapsModule,
    ]
})
export class AddLocationModule { }
