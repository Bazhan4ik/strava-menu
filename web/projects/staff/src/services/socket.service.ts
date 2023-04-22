import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from "rxjs";
import { CookItemsEvent } from '../models/socket-cook-items';
import { DeliveryEvent } from '../models/socket-delivery';
import { WaiterItemsEvent } from '../models/socket-waiter-items';
import { WaiterRequestEvent } from '../models/waiter-request-socket';
import { StaffService } from './staff.service';


@Injectable({
    providedIn: 'root'
})
export class SocketService {


    private waiterRequests: Observable<WaiterRequestEvent>;
    private cookItems: Observable<CookItemsEvent>;
    private waiterItems: Observable<WaiterItemsEvent>;
    private delivery: Observable<DeliveryEvent>


    constructor(
        private socket: Socket,
        private service: StaffService,
    ) { };


    public get $cookItems(): Observable<CookItemsEvent> {
        if(!this.cookItems) {
            this.cookItems = new Observable(sub => {
                this.socket.on("cook", (data: CookItemsEvent) => {
                    if(data.types.includes("items")) {
                        sub.next(data);
                    }
                });
            });
        }


        return this.cookItems;
    }
    public get $waiterItems(): Observable<WaiterItemsEvent> {
        if(!this.waiterItems) {
            this.waiterItems = new Observable(sub => {
                this.socket.on("waiter", (data: WaiterItemsEvent) => {
                    if(data.types.includes("items")) {
                        sub.next(data);
                    }
                });
            });
        }


        return this.waiterItems;
    }
    public get $delivery(): Observable<DeliveryEvent> {
        if(!this.delivery) {
            this.delivery = new Observable(sub => {
                this.socket.on("waiter", (data: DeliveryEvent) => {
                    if(data.types.includes("delivery")) {
                        sub.next(data);
                    }
                });
            });
        }


        return this.delivery;
    }
    public get $waiterRequests(): Observable<WaiterRequestEvent> {
        if(!this.waiterRequests) {
            this.waiterRequests = new Observable(sub => {
                this.socket.on("waiter", (data: WaiterRequestEvent) => {
                    if(data.types.includes("request")) {
                        sub.next(data);
                    }
                });
            });
        }


        return this.waiterRequests;
    }


    socketId() {


        return new Observable<string>(subs => {
            if(this.socket.ioSocket.id) {
                subs.next(this.socket.ioSocket.id);
            }

            this.socket.on("connect", () => {
                subs.next(this.socket.ioSocket.id);

                if(this.service.locationId) {
                    this.service.init(this.socket.ioSocket.id, this.service.locationId);
                }
            });
        });
    }
    




    emit(data: any) {
        this.socket.emit("staff", data);
    }


    


}
