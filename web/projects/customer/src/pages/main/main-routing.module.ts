import { NgModule } from '@angular/core';
import { RouterModule, Routes, RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuseStrategy } from '../../other/custom-route-reuse-strategy';
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
                path: "dish/:dishId",
                loadComponent: () => import("./pages/full-dish/full-dish.page").then(c => c.FullDishPage),
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
