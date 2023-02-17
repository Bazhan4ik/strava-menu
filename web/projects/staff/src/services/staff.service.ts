import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'environment/environment';
import { firstValueFrom } from 'rxjs';

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


    getRestaurant(restaurantId: string) {
        return firstValueFrom(
            this.http.get(this.baseUrl + restaurantId)
        )
    }

    addLocationAndJoinRooms(socketId: string, locationId: string) {
        return firstValueFrom(
            this.http.get(this.baseUrl + this.restaurant.id + "/" + locationId + "/init", { params: { socketId } })
        );
    }




}
