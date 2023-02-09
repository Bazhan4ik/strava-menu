import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MenuRoutingModule } from './menu-routing.module';
import { MenuPage } from './menu.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        MenuPage,
    ],
    imports: [
        CommonModule,
        MenuRoutingModule,
        MatIconModule,
    ]
})
export class MenuModule { }
