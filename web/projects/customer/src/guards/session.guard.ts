import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, UrlTree } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { CustomerService } from '../services/customer.service';

@Injectable({
    providedIn: 'root'
})
export class SessionGuard implements CanActivate {

    constructor(
        private cookieService: CookieService,
        private service: CustomerService
    ) { };

    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {



        const locatioId = route.paramMap.get("locationId");
        const restaurant = route.paramMap.get("restaurantId");


        const result = await this.service.init(restaurant!, locatioId!);
        


        return result;
    }

}
