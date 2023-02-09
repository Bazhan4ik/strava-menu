import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IonMenu } from '@ionic/angular';
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
                loadChildren: () => import("./pages/home/home.module").then(m => m.HomeModule),
            },


            {
                path: "menu",
                loadChildren: () => import("./pages/all-dishes/menu/menu.module").then(m => m.MenuModule),
            }
            

            ,


            {
                path: "menu/dishes/add",
                loadChildren: () => import("./pages/all-dishes/add-dish/add-dish.module").then(m => m.AddDishModule),
            },
            {
                path: "menu/dishes/:dishId",
                loadChildren: () => import("./pages/all-dishes/dish/dish.module").then(m => m.DishModule),
            },
            {
                path: "menu/dishes/:dishId/edit",
                loadChildren: () => import("./pages/all-dishes/edit-dish/edit-dish.module").then(m => m.EditDishModule),
            }
            
            
            ,


            {
                path: "menu/collections/add",
                loadChildren: () => import("./pages/all-collections/add-collection/add-collection.module").then(m => m.AddCollectionModule),
            },
            {
                path: "menu/collections/:collectionId",
                loadChildren: () => import("./pages/all-collections/collection/collection.module").then(m => m.CollectionModule),
            },
            {
                path: "menu/collections/:collectionId/edit",
                loadChildren: () => import("./pages/all-collections/edit-collection/edit-collection.module").then(m => m.EditCollectionModule),
            }


            ,


            {
                path: "settings",
                loadChildren: () => import("./pages/settings/settings.module").then(m => m.SettingsModule),
            }


            ,


            {
                path: "locations",
                loadChildren: () => import("./pages/all-locations/locations/locations.module").then(m => m.LocationsModule),
            },
            {
                path: "locations/add",
                loadChildren: () => import("./pages/all-locations/add-location/add-location.module").then(m => m.AddLocationModule),
            }


            ,


            {
                path: "staff",
                loadChildren: () => import("./pages/all-staff/staff/staff.module").then(m => m.StaffModule),
            },
            {
                path: "staff/add",
                loadChildren: () => import("./pages/all-staff/add-worker/add-worker.module").then(m => m.AddWorkerModule),
            },
            {
                path: "staff/:userId",
                loadChildren: () => import("./pages/all-staff/worker/worker.module").then(m => m.WorkerModule),
            }


            ,


            {
                path: "orders",
                loadChildren: () => import("./pages/orders/orders.module").then(m => m.OrdersModule),
            }


            ,


            {
                path: "customers",
                loadChildren: () => import("./pages/all-customers/customers/customers.module").then(m => m.CustomersModule),
            }


            ,


            {
                path: "tables",
                loadChildren: () => import("./pages/tables/tables.module").then(m => m.TablesModule),
            }
        ]
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
