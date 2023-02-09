import { DOCUMENT } from '@angular/common';
import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { env } from 'environment/environment';
import { LocationIdGuard } from '../guards/location-id.guard';
import { RestaurantIdGuard } from '../guards/restaurant-id.guard';
import { SequentialGuardsExecution } from '../guards/sequence-guard.guard';

const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        canActivate: [() => inject(DOCUMENT).location.href = env.accountUrl + "/home"],
        redirectTo: "",
    },
    {
        path: ":restaurantId",
        loadChildren: () => import("./../pages/location/location.module").then(m => m.LocationModule),
        canActivate: [RestaurantIdGuard],
    },
    {
        path: ":restaurantId/:locationId",
        loadChildren: () => import("./../pages/main/main.module").then(m => m.MainModule),
        data: {
            guards: [RestaurantIdGuard, LocationIdGuard],
        },
        canActivate: [SequentialGuardsExecution]
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
