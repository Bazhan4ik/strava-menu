import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom, Observable } from 'rxjs';
import { CustomerService } from '../services/customer.service';

@Injectable({
    providedIn: 'root'
})
export class SessionGuard implements CanActivate {

    constructor(
        private cookieService: CookieService,
        private service: CustomerService,
        private router: Router,
        private route: ActivatedRoute,
    ) { };

    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {



        const locatioId = route.paramMap.get("locationId");
        const restaurant = route.paramMap.get("restaurantId");
        const table = route.queryParamMap.get("table");
        const socketId = await firstValueFrom(
            this.service.socketId()
        );


        const result = await this.service.init(restaurant!, locatioId!, socketId!, table!);

        return result;
    }

}
