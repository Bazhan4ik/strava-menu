import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { env } from 'environment/environment';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
    providedIn: 'root'
})
export class LoggedInGuard implements CanActivate {

    constructor(
        private cookieService: CookieService,
        private router: Router,
    ) {}


    canActivate(): boolean {

        const cookie = this.cookieService.get("smjwt");

        if(!cookie) {
            window.location.href = `${env.accountUrl}/login?ll=${ encodeURIComponent(`${env.restaurantUrl}/dashboard${this.router.url}`) }`;
        }

        return !!cookie;
    }

}
