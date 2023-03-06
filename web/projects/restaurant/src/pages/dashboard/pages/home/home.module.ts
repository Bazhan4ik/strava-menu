import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { NgChartsModule } from 'ng2-charts';


@NgModule({
    declarations: [
        HomePage
    ],
    imports: [
        CommonModule,
        HomeRoutingModule,
        NgChartsModule,
    ]
})
export class HomeModule { }
