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
                loadChildren: () => import("./pages/menu/menu.module").then(m => m.MenuModule),
            }
            

            ,


            {
                path: "menu/items/add",
                loadChildren: () => import("./pages/all-items/add-item/add-item.module").then(m => m.AddItemModule),
            },
            {
                path: "menu/items/:itemId",
                loadChildren: () => import("./pages/all-items/item/item.module").then(m => m.ItemModule),
            },
            {
                path: "menu/items/:itemId/edit",
                loadChildren: () => import("./pages/all-items/edit-item/edit-item.module").then(m => m.EditItemModule),
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
                path: "menu/folders/add",
                loadChildren: () => import("./pages/all-collections/add-folder/add-folder.module").then(m => m.AddFolderModule),
            },
            {
                path: "menu/folders/:folderId",
                loadChildren: () => import("./pages/all-collections/folder/folder.module").then(m => m.FolderModule),
            },
            {
                path: "menu/folders/:collectionId/edit",
                loadChildren: () => import("./pages/all-collections/edit-collection/edit-collection.module").then(m => m.EditCollectionModule),
            }


            ,


            {
                path: "settings",
                loadChildren: () => import("./pages/settings/settings.module").then(m => m.SettingsModule),
            }


            ,


            {
                path: "layout",
                loadChildren: () => import("./pages/customer-layout/customer-layout.module").then(m => m.CustomerLayoutModule),
            }


            ,


            {
                path: "locations",
                loadChildren: () => import("./pages/all-locations/locations/locations.module").then(m => m.LocationsModule),
            },
            {
                path: "locations/add",
                loadChildren: () => import("./pages/all-locations/add-location/add-location.module").then(m => m.AddLocationModule),
            },
            {
                path: "locations/:locationId",
                loadChildren: () => import("./pages/all-locations/location/location.module").then(m => m.LocationModule),
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
                loadChildren: () => import("./pages/all-orders/orders/orders.module").then(m => m.OrdersModule),
            },
            {
                path: "orders/:orderId",
                loadChildren: () => import("./pages/all-orders/order/order.module").then(m => m.OrderModule),
            }


            ,


            {
                path: "customers",
                loadChildren: () => import("./pages/all-customers/customers/customers.module").then(m => m.CustomersModule),
            }


            ,


            {
                path: "tables",
                loadChildren: () => import("./pages/all-tables/select-live-location/select-live-location.module").then(m => m.SelectLiveLocationModule),
            },
            {
                path: "tables/qr-codes",
                loadChildren: () => import("./pages/all-tables/tables-qr-codes/tables-qr-codes.module").then(m => m.TablesQrCodesModule),
            },
            {
                path: "tables/:locationId",
                loadChildren: () => import("./pages/all-tables/tables/tables.module").then(m => m.TablesModule),
            }


            ,


            {
                path: "ingredients",
                loadChildren: () => import("./pages/all-ingredients/ingredients/ingredients.module").then(m => m.IngredientsModule),
            },
            {
                path: "ingredients/:ingredientId",
                loadChildren: () => import("./pages/all-ingredients/ingredient/ingredient.module").then(m => m.IngredientModule),
            }
        ]
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
