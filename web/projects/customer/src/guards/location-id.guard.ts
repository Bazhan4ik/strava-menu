import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { CustomerService } from '../services/customer.service';

@Injectable({
    providedIn: 'root'
})
export class LocationIdGuard implements CanActivate {

    constructor(
        private service: CustomerService,
        private router: Router,
    ) {}

    canActivate(route: ActivatedRouteSnapshot): boolean {

        const locationId = route.paramMap.get("locationId");

        if(!locationId) {
            this.router.navigate([this.service.restaurant.id]);
            return false;
        }

        this.service.locationId = locationId;

        return true;
    }

}
