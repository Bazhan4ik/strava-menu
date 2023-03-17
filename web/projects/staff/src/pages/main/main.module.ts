import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { WaiterRequestsComponent } from './components/waiter-requests/waiter-requests.component';
import { MainPage } from './main.page';
import { WaiterRequestComponent } from './components/waiter-request/waiter-request.component';
import { DishesCookComponent } from './components/cook/dishes-cook/dishes-cook.component';
import { DishCookComponent } from './components/cook/dish-cook/dish-cook.component';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        WaiterRequestsComponent,
        MainPage,
        WaiterRequestComponent,
        DishesCookComponent,
    ],
    imports: [
        CommonModule,
        DishCookComponent,
        MainRoutingModule,
        MatIconModule,
    ]
})
export class MainModule { }
