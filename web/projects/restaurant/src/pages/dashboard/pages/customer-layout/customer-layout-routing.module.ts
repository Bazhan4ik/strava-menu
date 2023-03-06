import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerLayoutPage } from './customer-layout.page';

const routes: Routes = [
    {
        path: "",
        component: CustomerLayoutPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CustomerLayoutRoutingModule { }
