import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
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

        const token = this.cookieService.get("smjwt");

        if(!token) {
            this.router.navigate(["login"]);
        }

        return !!token;
    }

}
