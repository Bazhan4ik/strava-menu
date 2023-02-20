import { DOCUMENT } from '@angular/common';
import { inject, NgModule } from '@angular/core';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';
import { env } from 'environment/environment';
import { LocationIdGuard } from '../guards/location-id.guard';
import { RestaurantIdGuard } from '../guards/restaurant-id.guard';
import { SessionGuard } from '../guards/session.guard';
import { CustomRouteReuseStrategy } from '../other/custom-route-reuse-strategy';

const routes: Routes = [
    {
        path: ":restaurantId",
        loadChildren: () => import("./../pages/location/location.module").then(m => m.LocationModule),
        canActivate: [RestaurantIdGuard],
    },
    {
        path: ":restaurantId/:locationId",
        loadChildren: () => import("./../pages/main/main.module").then(m => m.MainModule),
        canActivate: [RestaurantIdGuard, LocationIdGuard, SessionGuard],
    },
    {
        path: "",
        pathMatch: "full",
        canActivate: [() => inject(DOCUMENT).location.href = env.accountUrl + "/home"],
        redirectTo: "",
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: "enabled" })],
    providers: [
        {
            provide: RouteReuseStrategy,
            useClass: CustomRouteReuseStrategy,
        }
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
