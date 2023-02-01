import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { LoggedInGuard } from '../guards/logged-in.guard';
import { RestaurantIdGuard } from '../guards/restaurant-id.guard';
import { env } from 'environment/environment';

const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        canActivate: [() => inject(DOCUMENT).location.href = env.accountUrl + "/home"],
        redirectTo: "",
    },
    {
        path: ":restaurantId",
        loadChildren: () => import("./../pages/dashboard/dashboard.module").then(m => m.DashboardModule),
        canActivate: [LoggedInGuard, RestaurantIdGuard],
        runGuardsAndResolvers: "always",
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
