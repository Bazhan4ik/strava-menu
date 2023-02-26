import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from "rxjs";
import { CookDishesEvent } from '../models/socket-cook-dishes';
import { WaiterDishesEvent } from '../models/socket-waiter-dishes';
import { WaiterRequestEvent } from '../models/waiter-request-socket';
import { StaffService } from './staff.service';


@Injectable({
    providedIn: 'root'
})
export class SocketService {


    private waiterRequests: Observable<WaiterRequestEvent>;
    private cookDishes: Observable<CookDishesEvent>;
    private waiterDishes: Observable<WaiterDishesEvent>;


    constructor(
        private socket: Socket,
        private service: StaffService,
    ) { };


    public get $cookDishes(): Observable<CookDishesEvent> {
        if(!this.cookDishes) {
            this.cookDishes = new Observable(sub => {
                this.socket.on("cook", (data: CookDishesEvent) => {
                    if(data.types.includes("dishes")) {
                        sub.next(data);
                    }
                });
            });
        }


        return this.cookDishes;
    }
    public get $waiterDishes(): Observable<WaiterDishesEvent> {
        if(!this.waiterDishes) {
            this.waiterDishes = new Observable(sub => {
                this.socket.on("waiter", (data: WaiterDishesEvent) => {
                    if(data.types.includes("dishes")) {
                        sub.next(data);
                    }
                });
            });
        }


        return this.waiterDishes;
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
