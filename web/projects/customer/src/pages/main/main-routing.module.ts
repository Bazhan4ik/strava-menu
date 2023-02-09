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
                loadComponent: () => import("./pages/recommendations/recommendations.page").then(c => c.RecommendationsPage)
            },
            {
                path: "p",
                loadComponent: () => import("./pages/preview/preview.page").then(c => c.PreviewPage),
            },
            {
                path: "p/checkout",
                loadComponent: () => import("./pages/checkout/checkout.page").then(c => c.CheckoutPage),
            },
            {
                path: "tracking",
                loadComponent: () => import("./pages/tracking/tracking.page").then(c => c.TrackingPage),
            },
            {
                path: ":dishId",
                loadComponent: () => import("./pages/full-dish/full-dish.page").then(c => c.FullDishPage),
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MainRoutingModule { }
