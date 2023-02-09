import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GeneralRoutingModule } from './general-routing.module';
import { GeneralPage } from './general.page';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        GeneralPage,
    ],
    imports: [
        CommonModule,
        GeneralRoutingModule,
        FormsModule,
        MatIconModule,
    ]
})
export class GeneralModule { }
