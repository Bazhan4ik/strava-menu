import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { MainPage } from './main.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        MainPage,
    ],
    imports: [
        CommonModule,
        MainRoutingModule,
        MatIconModule,
    ]
})
export class MainModule { }
