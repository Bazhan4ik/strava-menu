import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { WaiterRequestsComponent } from './components/waiter-requests/waiter-requests.component';
import { MainPage } from './main.page';
import { WaiterRequestComponent } from './components/waiter-request/waiter-request.component';
import { ItemsCookComponent } from './components/cook/items-cook/items-cook.component';
import { ItemCookComponent } from './components/cook/item-cook/item-cook.component';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        WaiterRequestsComponent,
        MainPage,
        WaiterRequestComponent,
        ItemsCookComponent,
    ],
    imports: [
        CommonModule,
        ItemCookComponent,
        MainRoutingModule,
        MatIconModule,
    ]
})
export class MainModule { }
