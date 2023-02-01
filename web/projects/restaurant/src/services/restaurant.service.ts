import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'environment/environment';
import { firstValueFrom } from "rxjs";

interface Restaurant {
    name: string;
    id: string;
}

@Injectable({
    providedIn: 'root'
})
export class RestaurantService {

    base = env.apiUrl + "/restaurants/";
    restaurant: Restaurant;

    currentDishId: string;

 
    constructor(
        public http: HttpClient,
    ) { }



    ingredients<T>(text: string) {
        return firstValueFrom(
            this.http.get<T>(env.apiUrl + "/data/ingredients", { params: { text } })
        );
    }
    tags<T>(text: string) {
        return firstValueFrom(
            this.http.get<T>(env.apiUrl + "/data/tags", { params: { text } })
        );
    }

    post<T>(body: any, ...path: string[]) {
        return firstValueFrom(
            this.http.post<T>(this.base + this.restaurant.id + "/" + path.join("/"), body)
        );
    }
    put<T>(body: any, ...path: string[]) {
        return firstValueFrom(
            this.http.put<T>(this.base + this.restaurant.id + "/" + path.join("/"), body)
        );
    }


    get<T>(...path: string[]) {
        return firstValueFrom(
            this.http.get<T>(this.base + this.restaurant.id + "/" + path.join("/")),
        );
    }


    getRestaurant(id: string) {
        return firstValueFrom(
            this.http.get<Restaurant>(this.base + id)
        );
    }
}
