import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { SocketService } from '../services/socket.service';
import { StaffService } from '../services/staff.service';

@Injectable({
    providedIn: 'root'
})
export class RestaurantIdGuard implements CanActivate {

    constructor(
        private service: StaffService,
        private socket: SocketService,
    ) {}


    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {

        const restaurantId = route.paramMap.get("restaurantId");

        if(!restaurantId) {
            return false;
        }

        const result: any = await this.service.getRestaurant(restaurantId);

        if(!result) {
            return false;
        }


        this.service.restaurant = result.restaurant;
        this.service.locations = result.locations;

        return true;
    }

}
