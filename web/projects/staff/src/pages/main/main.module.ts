import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { WaiterRequestsComponent } from './components/waiter-requests/waiter-requests.component';
import { MainPage } from './main.page';
import { WaiterRequestComponent } from './components/waiter-request/waiter-request.component';
import { DishesCookComponent } from './components/dishes-cook/dishes-cook.component';
import { DishCookComponent } from './components/dish-cook/dish-cook.component';
import { DishesWaiterComponent } from './components/dishes-waiter/dishes-waiter.component';
import { DishWaiterComponent } from './components/dish-waiter/dish-waiter.component';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        WaiterRequestsComponent,
        MainPage,
        WaiterRequestComponent,
        DishesCookComponent,
        DishCookComponent,
        DishesWaiterComponent,
        DishWaiterComponent
    ],
    imports: [
        CommonModule,
        MainRoutingModule,
        MatIconModule,
    ]
})
export class MainModule { }
