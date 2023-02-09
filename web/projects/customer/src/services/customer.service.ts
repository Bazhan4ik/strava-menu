import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'environment/environment';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom, Observable } from "rxjs";
import { Session } from '../pages/main/models/session';
import { Socket } from "ngx-socket-io";
import { DishesSocketEvent, PaymentSocketEvent, SocketEvent, WaiterRequestSocketEvent } from '../pages/main/models/socket';



@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    baseUrl = env.apiUrl + "/customer";

    restaurant: { name: string; id: string; };
    locationId: string;

    session: Session;


    private waiterRequest: WaiterRequestSocketEvent;
    private payments: PaymentSocketEvent;
    private dishes: DishesSocketEvent;

    constructor(
        private http: HttpClient,
        private cookieService: CookieService,
        private socket: Socket
    ) { };


    
    
    public get $waiterRequest(): WaiterRequestSocketEvent {
        if(!this.waiterRequest) {
            this.waiterRequest = new Observable(subs => {
                this.socket.on("customer", (data: SocketEvent) => {
                    if(data.types.includes("request")) {
                        subs.next(data);
                    }
                });
            });
        }

        return this.waiterRequest;
    }
    public get $dishes(): DishesSocketEvent {
        if(!this.dishes) {
            this.dishes = new Observable(subs => {
                this.socket.on("customer", (data: SocketEvent) => {
                    if(data.types.includes("dishes")) {
                        subs.next(data);
                    }
                });
            });
        }

        return this.dishes;
    }
    public get $payments() {
        if(!this.payments) {
            this.payments = new Observable(subs => {
                this.socket.on("customer", (data: SocketEvent) => {
                    if(data.types.includes("payment")) {
                        subs.next(data);
                    }
                });
            });
        }

        return this.payments;
    }
    

    socketId(): Promise<string> {
        
        return new Promise<string>(res => {
            if(this.socket.ioSocket.id) {
                res(this.socket.ioSocket.id);
                return;
            }

            this.socket.connect();

            this.socket.on("connect", (sid: any) => {
                res(this.socket.ioSocket.id);
            });
        });
    }
    

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

    async init(restaurantId: string, locationId: string, socketId: string, table: string) {
        const result = await firstValueFrom(
            this.http.get<{
                restaurant: any;
                session: Session;
                setSessionId: string;
            }>(this.baseUrl + "/" + restaurantId + "/session", { params: { socketId, table, location: locationId } }),
        );

        if(result.setSessionId) {
            if(this.cookieService.get("smsid")) {
                this.cookieService.delete("smsid", "/");
            }
            this.cookieService.set("smsid", result.setSessionId, 7, "/");
        }

        this.session = result.session;
        this.restaurant = result.restaurant;

        return true;
    }

}
