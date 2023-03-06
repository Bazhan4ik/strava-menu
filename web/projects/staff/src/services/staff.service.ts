import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'environment/environment';
import { firstValueFrom } from 'rxjs';
import { SocketService } from './socket.service';

@Injectable({
    providedIn: 'root'
})
export class StaffService {

    baseUrl = env.apiUrl + "/staff/";

    restaurant: { id: string; redirectTo: string; name: string; pages: {
        cook: boolean;
        waiter: boolean;
        requests: boolean;
    } };
    locations: any[];
    locationId: string;
    userId: string;

    constructor(
        private http: HttpClient,
    ) { };


    get<T>(...path: string[]) {
        return firstValueFrom(
            this.http.get<T>(this.baseUrl + this.restaurant.id + "/" + this.locationId + "/" + path.join("/"))
        );
    }
    put<T>(body: any, ...path: string[]) {
        return firstValueFrom(
            this.http.put<T>(this.baseUrl + this.restaurant.id + "/" + this.locationId + "/" + path.join("/"), body)
        );
    }
    post<T>(body: any, ...path: string[]) {
        return firstValueFrom(
            this.http.post<T>(this.baseUrl + this.restaurant.id + "/" + this.locationId + "/" + path.join("/"), body)
        );
    }
    delete<T>(...path: string[]) {
        return firstValueFrom(
            this.http.delete<T>(this.baseUrl + this.restaurant.id + "/" + this.locationId + "/" + path.join("/"))
        );
    }


    getRestaurant(restaurantId: string) {
        return firstValueFrom(
            this.http.get(this.baseUrl + restaurantId)
        )
    }

    async init(socketId: string, locationId: string) {
        const result: any = await firstValueFrom(
            this.http.get(this.baseUrl + this.restaurant.id + "/" + locationId + "/init", { params: { socketId } })
        );

        this.restaurant.pages = result.pages;
        this.restaurant.redirectTo = result.redirectTo;
        this.locationId = locationId;
        this.userId = result.userId;

        return true;
    }

    async initManualOrdering(socketId: string) {
        const result: any = await firstValueFrom(
            this.http.get(this.baseUrl + this.restaurant.id + "/" + this.locationId + "/order", { params: { socketId } })
        );

        return result;
    }




}
