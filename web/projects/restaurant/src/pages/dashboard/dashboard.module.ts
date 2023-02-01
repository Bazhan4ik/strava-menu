import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './dashboard.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        DashboardPage,
    ],
    imports: [
        CommonModule,
        DashboardRoutingModule,
        MatIconModule,
    ]
})
export class DashboardModule { }
