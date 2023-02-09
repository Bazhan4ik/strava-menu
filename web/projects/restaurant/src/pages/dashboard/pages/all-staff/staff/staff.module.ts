import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaffRoutingModule } from './staff-routing.module';
import { StaffPage } from './staff.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        StaffPage,
    ],
    imports: [
        CommonModule,
        StaffRoutingModule,
        MatIconModule,
    ]
})
export class StaffModule { }
