import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { ConvertedSessionDish } from 'projects/staff/src/models/order-dishes';
import { WaiterDishesData } from 'projects/staff/src/models/socket-waiter-dishes';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from "rxjs";
import { DishWaiterComponent } from '../dish-waiter/dish-waiter.component';

@Component({
    selector: 'app-dishes-waiter',
    templateUrl: './dishes-waiter.component.html',
    styleUrls: ['./dishes-waiter.component.scss'],
    standalone: true,
    imports: [CommonModule, DishWaiterComponent]
})
export class DishesWaiterComponent implements OnInit, OnDestroy {
    dishes: ConvertedSessionDish[];
    subscription: Subscription;


    constructor(
        private service: StaffService,
        private socket: SocketService,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async openDishModal(dish: ConvertedSessionDish) {
        const { WaiterDishModal } = await import("../../../modals/waiter-dish/waiter-dish.modal");

        const component = this.modalContainer.createComponent(WaiterDishModal);

        component.instance.sessionDish = dish;

        component.instance.leave.subscribe((served: boolean) => {
            if(served) {
                for(let i in this.dishes) {
                    if(this.dishes[i]._id == dish._id) {
                        this.dishes.splice(+i, 1);
                        break;
                    }
                }
            }
            component.destroy();
        });
    }



    async ngOnInit() {
        this.subscription = this.socket.$waiterDishes.subscribe(res => {
            console.log(res);
            if(res.types.includes("dishes/add")) {
                this.dishes.push(res.data as WaiterDishesData.add);
            } else if(res.types.includes("dishes/serve")) {
                const { sessionId, sessionDishId } = res.data as WaiterDishesData.serve;

                for(let i in this.dishes) {
                    if(this.dishes[i]._id == sessionDishId) {
                        this.dishes.splice(+i, 1);
                        break;
                    }
                }
            }
        });


        const result: ConvertedSessionDish[] = await this.service.get("waiter/dishes");

        this.dishes = result;
    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
