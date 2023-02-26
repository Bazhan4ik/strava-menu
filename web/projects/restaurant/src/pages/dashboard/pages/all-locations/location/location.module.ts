import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocationRoutingModule } from './location-routing.module';
import { LocationPage } from './location.page';
import { MatIconModule } from '@angular/material/icon';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        LocationPage,
    ],
    imports: [
        CommonModule,
        LocationRoutingModule,
        MatIconModule,
        IonicModule,
        FormsModule,
    ]
})
export class LocationModule { }
