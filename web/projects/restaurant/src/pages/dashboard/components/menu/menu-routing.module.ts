import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuPage } from './menu.page';

const routes: Routes = [
    {
        path: "",
        component: MenuPage,
        children: [
            {
                path: "",
                pathMatch: "full",
                redirectTo: "dishes",
            },
            {
                path: "dishes",
                loadChildren: () => import("./pages/dishes/dishes.module").then(m => m.DishesModule),
            },
            {
                path: "collections",
                loadChildren: () => import("./pages/collections/collections.module").then(m => m.CollectionsModule),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MenuRoutingModule { }
