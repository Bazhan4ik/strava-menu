import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { CustomerService } from '../services/customer.service';

@Injectable({
    providedIn: 'root'
})
export class RestaurantIdGuard implements CanActivate {

    constructor(
        private service: CustomerService,
        private router: Router,
    ) {}

    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {

        const restaurantId = route.paramMap.get("restaurantId");

        if(!restaurantId) {
            this.router.navigate(["map"]);
            return false;
        }

        // if(!this.service.restaurant) {
        //     const result: any = await this.service.getRestaurant(restaurantId);

        //     if(!result) {
        //         this.router.navigate(["map"]);
        //         return false;
        //     }
            
        //     this.service.restaurant = result;
        // }


        return true;
    }

}
