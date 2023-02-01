import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocationRoutingModule } from './location-routing.module';
import { LocationPage } from './location.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        LocationPage,
    ],
    imports: [
        CommonModule,
        LocationRoutingModule,
        MatIconModule,
    ]
})
export class LocationModule { }
