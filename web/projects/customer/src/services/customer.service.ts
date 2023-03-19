import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from 'environment/environment';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom, Observable } from "rxjs";
import { Session } from '../pages/main/models/session';
import { Socket } from "ngx-socket-io";
import { ItemsSocketEvent, PaymentSocketEvent, SocketEvent, WaiterRequestSocketEvent } from '../pages/main/models/socket';
import { Router } from '@angular/router';



@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    baseUrl = env.apiUrl + "/customer";

    restaurant: { name: string; id: string; _id: string; };
    locationId: string;
    showTracking: boolean;

    session: Session;


    private waiterRequest: WaiterRequestSocketEvent;
    private payments: PaymentSocketEvent;
    private items: ItemsSocketEvent;

    constructor(
        private http: HttpClient,
        private cookieService: CookieService,
        private socket: Socket,
        private router: Router,
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
    public get $items(): ItemsSocketEvent {
        if(!this.items) {
            this.items = new Observable(subs => {
                this.socket.on("customer", (data: SocketEvent) => {
                    if(data.types.includes("items")) {
                        subs.next(data);
                    }
                });
            });
        }

        return this.items;
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


    socketId(): Observable<string> {

        return new Observable<string>(subs => {
            if(this.socket.ioSocket.id) {
                subs.next(this.socket.ioSocket.id);
                return;
            }

            this.socket.connect();

            this.socket.on("connect", (sid: any) => {
                subs.next(this.socket.ioSocket.id);

                if(this.session) {
                    this.init(this.restaurant.id, this.locationId, this.socket.ioSocket.id, undefined!);
                }

            });
        })
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
        let result: {
            restaurant: any;
            session: Session;
            setSessionId: string;
            showTracking: boolean;
        } = null!;

        try {
            result = await firstValueFrom(
                this.http.get<any>(this.baseUrl + "/" + restaurantId + "/session", { params: { socketId, table, location: locationId } }),
            );
        } catch (e: any) {
            if(e.status == 400) {
                if(e.error.reason == "InvalidLocation") {
                    this.router.navigate([restaurantId]);
                    return false;
                }
            }   
        }

        if(!result) {
            return false;
        }

        if(result.setSessionId) {
            if(this.cookieService.get("smsid")) {
                this.cookieService.delete("smsid", "/");
            }
            this.cookieService.set("smsid", result.setSessionId, 7, "/");
        }

        this.showTracking = result.showTracking;
        this.session = result.session;
        this.restaurant = result.restaurant;

        return true;
    }

}
