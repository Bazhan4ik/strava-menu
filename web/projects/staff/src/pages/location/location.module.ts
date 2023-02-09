import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocationRoutingModule } from './location-routing.module';
import { MatIconModule } from '@angular/material/icon';
import { LocationPage } from './location.page';


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
