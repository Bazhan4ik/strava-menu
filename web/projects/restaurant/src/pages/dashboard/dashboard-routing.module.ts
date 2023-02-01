import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPage } from './dashboard.page';

const routes: Routes = [
    {
        path: "",
        component: DashboardPage,
        children: [
            {
                path: "",
                pathMatch: "full",
                redirectTo: "home",
            },
            {
                path: "home",
                loadChildren: () => import("./components/home/home.module").then(m => m.HomeModule),
            },


            {
                path: "menu",
                loadChildren: () => import("./components/menu/menu.module").then(m => m.MenuModule),
            }
            

            ,


            {
                path: "menu/dishes/add",
                loadChildren: () => import("./components/dishes-m/add-dish/add-dish.module").then(m => m.AddDishModule),
            },
            {
                path: "menu/dishes/:dishId",
                loadChildren: () => import("./components/dishes-m/dish/dish.module").then(m => m.DishModule),
            },
            {
                path: "menu/dishes/:dishId/edit",
                loadChildren: () => import("./components/dishes-m/edit-dish/edit-dish.module").then(m => m.EditDishModule),
            }
            
            
            ,


            {
                path: "menu/collections/add",
                loadChildren: () => import("./components/collections-m/add-collection/add-collection.module").then(m => m.AddCollectionModule),
            },
            {
                path: "menu/collections/:collectionId",
                loadChildren: () => import("./components/collections-m/collection/collection.module").then(m => m.CollectionModule),
            },
            {
                path: "menu/collections/:collectionId/edit",
                loadChildren: () => import("./components/collections-m/edit-collection/edit-collection.module").then(m => m.EditCollectionModule),
            }
            
            
            ,
        
            
            {
                path: "settings",
                loadChildren: () => import("./components/settings/settings.module").then(m => m.SettingsModule),
            },
            {
                path: "locations",
                loadChildren: () => import("./components/locations-m/locations/locations.module").then(m => m.LocationsModule),
            },
            {
                path: "locations/add",
                loadChildren: () => import("./components/locations-m/add-location/add-location.module").then(m => m.AddLocationModule),
            },
        ]
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
