import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DishPage } from './dish.page';

const routes: Routes = [
    {
        path: "",
        component: DishPage,
        children: [
            {
                path: "",
                pathMatch: "full",
                redirectTo: "collections",
            },
            {
                path: "collections",
                loadComponent: () => import("./pages/collections/collections.page").then(c => c.CollectionsPage),
            },
            {
                path: "orders",
                loadComponent: () => import("./pages/orders/orders.page").then(c => c.OrdersPage),
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DishRoutingModule { }
