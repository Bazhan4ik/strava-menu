import { Component, OnDestroy, OnInit, ViewContainerRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ConvertedSessionDish } from 'projects/staff/src/models/order-dishes';
import { CookDishesData } from 'projects/staff/src/models/socket-cook-dishes';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dishes-cook',
  templateUrl: './dishes-cook.component.html',
  styleUrls: ['./dishes-cook.component.scss']
})
export class DishesCookComponent implements OnInit, OnDestroy {
    dishes: ConvertedSessionDish[];
    subscription: Subscription;


    constructor(
        private service: StaffService,
        private socket: SocketService,
        private changeDetector: ChangeDetectorRef,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    async openDishModal(dish: ConvertedSessionDish) {
        const { CookDishModal } = await import("./../../modals/cook-dish/cook-dish.modal");


        const component = this.modalContainer.createComponent(CookDishModal);

        component.instance.sessionDish = dish;


        component.instance.leave.subscribe((a: "done" | "taken") => {
            if(a == "taken") {
                for(let i in this.dishes) {
                    if(this.dishes[i]._id == dish._id) {
                        
                        if(dish.takenInterval) {
                            return;
                        }

                        dish.takenInterval = setInterval(() => {
                            dish.time.taken!.minutes++;
                            if(dish.time.taken?.minutes == 60) {
                                dish.time.taken.hours++;
                                dish.time.taken.minutes = 0;
                            }
                        }, 60000);


                        return;
                    }
                }
            } else if(a == "done") {
                for(let i in this.dishes) {
                    if(this.dishes[i]._id == dish._id) {
                        this.dishes.splice(+i, 1);

                        this.changeDetector.detectChanges(); // so dish-cook.component's ngOnDestroy called
                        break;
                    }
                }
            } else if(a == "removed") {
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

        this.subscription = this.socket.$cookDishes.subscribe(res => {
            if(res.types.includes("dishes/new")) {
                this.dishes.push(...res.data as CookDishesData.add);
            } else if(res.types.includes("dishes/take")) {
                const { sessionId, sessionDishId, cook } = res.data as CookDishesData.take;

                for(let dish of this.dishes) {
                    if(dish._id == sessionDishId) {
                        dish.status = "cooking";
                        dish.people.cook = cook;
                        dish.time.taken = { hours: 0, minutes: 0, nextMinute: null! };

                        if(dish.takenInterval) {
                            return;
                        }

                        dish.takenInterval = setInterval(() => {
                            dish.time.taken!.minutes++;
                            if(dish.time.taken!.minutes == 60) {
                                dish.time.taken!.minutes = 0;
                                dish.time.taken!.hours++;
                            }
                        }, 60000);
                    }
                }
            } else if(res.types.includes("dishes/quit")) {
                const { sessionId, sessionDishId } = res.data as CookDishesData.quit;

                for(let dish of this.dishes) {
                    if(dish._id == sessionDishId) {
                        dish.status = "ordered";
                        dish.time.taken = null!;

                        clearInterval(dish.takenInterval);
                        clearInterval(dish.takenTimeout);
                        dish.takenInterval = null;
                    }
                }
            } else if(res.types.includes("dishes/done")) {
                const { sessionId, sessionDishId } = res.data as CookDishesData.done;

                for(let i in this.dishes) {
                    if(this.dishes[i]._id == sessionDishId) {
                        this.dishes.splice(+i, 1);
                        break;
                    }
                }

            }
        });
        
        this.dishes = await this.service.get("cook/dishes");


        console.log(this.dishes);



    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
