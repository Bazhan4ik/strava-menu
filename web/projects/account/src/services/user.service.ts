import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { env } from 'environment/environment';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom } from 'rxjs';
import { JWT } from '../models/general';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    url: string;

    constructor(
        private http: HttpClient,
        private cookieService: CookieService,
        private router: Router,
    ) {
        this.url = env.apiUrl + "/accounts";
    }

    async create(data: { name: { first: string; last: string; }, password: string, email: string; }) {
        const result = await firstValueFrom(
            this.http.post<{ name: { first: string; last: string; }; token: string; expires: number; }>(this.url + "/create", { user: data }, { headers: { "Skip-Authentication": "true" } })
        );

        if(result.token) {
            // this.cookieService.set("smjwt", result.token, new Date(result.expires), "/");
            this.cookieService.set("smjwt", result.token, new Date(result.expires), "/", "mydomain.com");
        }

        return true;
    }

    async login(email: string, password: string) {
        const result = await firstValueFrom(
            this.http.post<{ token: string; expires: number; }>(this.url + "/login", { email, password }, { headers: { "Skip-Authentication": "true" } })
        );

        return true;
    }

    logout() {
        this.cookieService.deleteAll("/", ".mydomain.com");

        this.router.navigate(["login"]);
    }


    get<T>(...path: string[]): Promise<T> {
        return firstValueFrom(
            this.http.get<T>(this.url + "/" + path.join("/"))
        );
    }
    post(body: any, ...path: string[]) {
        return firstValueFrom(
            this.http.post(this.url + "/" + path.join("/"), body)
        );
    }
}
