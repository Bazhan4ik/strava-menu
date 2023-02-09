import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationsRoutingModule } from './locations-routing.module';
import { LocationsPage } from './locations.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        LocationsPage,
    ],
    imports: [
        CommonModule,
        LocationsRoutingModule,
        MatIconModule,
    ]
})
export class LocationsModule { }
