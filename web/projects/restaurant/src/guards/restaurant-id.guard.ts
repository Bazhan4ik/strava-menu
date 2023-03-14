import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { env } from 'environment/environment';
import { Observable } from 'rxjs';
import { RestaurantService } from '../services/restaurant.service';

@Injectable({
    providedIn: 'root'
})
export class RestaurantIdGuard implements CanActivate {

    constructor(
        private service: RestaurantService,
    ) {}

    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {

        const restaurantId = route.paramMap.get("restaurantId");

        if(!restaurantId) {
            window.location.href = env.accountUrl + "/home";
            return false;
        }

        if(!this.service.restaurant) {

            try {
                const result = await this.service.getRestaurant(restaurantId);
    
    
                if(!result) {
                    window.location.href = env.accountUrl + "/home";
    
                    return false;
                }
    
                this.service.restaurant = result;
            } catch (e: any) {
                if(e.status == 404) {
                    if(e.error.reason == "RestaurantNotFound") {
                        window.location.href = `${env.accountUrl}/home`;
                    }
                }
            }
        }



        return true;
    }

}
