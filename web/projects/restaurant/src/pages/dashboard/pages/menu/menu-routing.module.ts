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
                redirectTo: "items",
            },
            {
                path: "items",
                loadChildren: () => import("./pages/items/items.module").then(m => m.ItemsModule),
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
