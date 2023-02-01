import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'environment/environment';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom } from "rxjs";
import { Session } from '../pages/main/models/session';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    baseUrl = env.apiUrl + "/customer";

    restaurant: { name: string; id: string; };
    locationId: string;

    session: Session;

    constructor(
        private http: HttpClient,
        private cookieService: CookieService,
    ) { };


    get<T>(queryParams: { [key: string]: string }, ...path: string[]) {
        return firstValueFrom(
            this.http.get<T>(this.baseUrl + "/" + this.restaurant.id + "/" + path.join("/"), { params: queryParams, })
        );
    }

    delete<T>(...path: string[]) {
        return firstValueFrom(
            this.http.delete<T>(this.baseUrl + "/" + this.restaurant.id + "/" + path.join("/"))
        );
    }

    post<T>(body: any, ...path: string[]) {
        return firstValueFrom(
            this.http.post<T>(this.baseUrl + "/" + this.restaurant.id + "/" + path.join("/"), body)
        )
    }
    
    put<T>(body: any, ...path: string[]) {
        return firstValueFrom(
            this.http.put<T>(this.baseUrl + "/" + this.restaurant.id + "/" + path.join("/"), body)
        )
    }

    getLocations<T>(restaurantId: string) {
        return firstValueFrom(
            this.http.get<T>(this.baseUrl + "/" + restaurantId + "/locations")
        );
    }

    async init(restaurantId: string, locationId: string) {
        const result = await firstValueFrom(
            this.http.get<{
                restaurant: any;
                session: Session;
                setSessionId: string;
            }>(this.baseUrl + "/" + restaurantId + "/session", { params: { location: locationId } }),
        );

        console.log(result);

        if(result.setSessionId) {
            if(this.cookieService.get("smsid")) {
                this.cookieService.delete("smsid", "/");
            }
            console.warn("INIT CALLED");
            this.cookieService.set("smsid", result.setSessionId, 7, "/");
        }

        this.session = result.session;
        this.restaurant = result.restaurant;

        return true;
    }

}
