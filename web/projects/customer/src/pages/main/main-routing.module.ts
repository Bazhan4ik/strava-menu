import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPage } from './main.page';

const routes: Routes = [
    {
        path: "",
        component: MainPage,
        children: [
            {
                path: "",
                redirectTo: "home",
                pathMatch: "full",
            },
            {
                path: "home",
                loadComponent: () => import("./pages/recommendations/recommendations.page").then(c => c.RecommendationsPage),
                data: { routeReuse: true }
            },
            {
                path: "order/preview",
                loadComponent: () => import("./pages/preview/preview.page").then(c => c.PreviewPage),
            },
            {
                path: "order/checkout",
                loadComponent: () => import("./pages/checkout/checkout.page").then(c => c.CheckoutPage),
                data: { routeReuse: false, }
            },
            {
                path: "order/tracking",
                loadComponent: () => import("./pages/tracking/tracking.page").then(c => c.TrackingPage),
            },
        
            {
                path: "collection/:collectionId",
                loadComponent: () => import("./pages/collection/collection.component").then(c => c.CollectionComponent),
                data: { routeReuse: true },
            },

            {
                path: "item/:itemId",
                loadComponent: () => import("./pages/full-item/full-item.page").then(c => c.FullItemPage),
            },
            {
                path: "**",
                redirectTo: "home",
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MainRoutingModule { }
