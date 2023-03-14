import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionDish } from 'projects/staff/src/models/order-dishes';
import { CookDishesData } from 'projects/staff/src/models/socket-cook-dishes';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-cook-dish',
    templateUrl: './cook-dish.modal.html',
    styleUrls: ['./cook-dish.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class CookDishModal implements OnInit, OnDestroy {

    customerAvatar = "./../../../../../../../global-resources/images/plain-avatar.jpg";
    cookAvatar = "./../../../../../../../global-resources/images/plain-avatar.jpg";
    userId: string;

    subscription: Subscription;

    disableButtons = false;
    modifiers: { name: string; selected: string[] }[];

    constructor(
        private service: StaffService,
        private socket: SocketService,
    ) {}


    @Input() sessionDish: ConvertedSessionDish;
    @Output() leave = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    close() {
        this.leave.emit();
    }

    async take() {
        this.disableButtons = true;
        const update: any = await this.service.put({ sessionId: this.sessionDish.sessionId, sessionDishId: this.sessionDish._id }, "cook/take");

        if(update.updated) {
            this.sessionDish.status = "cooking";
            this.sessionDish.people.cook = update.cook;
            this.sessionDish.time.taken = update.time;
            this.leave.emit("taken");
        }

        this.disableButtons = false;
    }

    async quit() {
        this.disableButtons = true;
        const update: any = await this.service.put({ sessionId: this.sessionDish.sessionId, sessionDishId: this.sessionDish._id }, "cook/quit");

        if(update.updated) {
            this.sessionDish.status = "ordered";
            this.sessionDish.people.cook = null!;
            this.sessionDish.time.taken = null!;

            clearInterval(this.sessionDish.takenInterval);
            clearTimeout(this.sessionDish.takenTimeout);
            this.sessionDish.takenInterval = null;
        }
        this.disableButtons = false;
    }

    async done() {
        this.disableButtons = true;
        const update: any = await this.service.put({ sessionId: this.sessionDish.sessionId, sessionDishId: this.sessionDish._id }, "cook/done");

        if(update.updated) {
            this.leave.emit("done");
            return;
        }
        this.disableButtons = false;
    }

    async remove() {
        this.disableButtons = true;
        const { RemoveDishModal } = await import("./../remove-dish/remove-dish.modal");

        const component = this.modalContainer.createComponent(RemoveDishModal);

        component.instance.leave.subscribe(async (reason: string) => {
            component.destroy();

            if(reason) {

                const update: any = await this.service.put({
                    sessionId: this.sessionDish.sessionId,
                    sessionDishId: this.sessionDish._id,
                    reason,
                }, "cook/remove");

                if(update.updated) {
                    this.leave.emit("removed");
                    return;
                }
            }

            this.disableButtons = false;
        });
    }



    async ngOnInit() {
        this.subscription = this.socket.$cookDishes.subscribe(res => {
            if(res.types.includes("dishes/done")) {
                const { sessionDishId } = res.data as CookDishesData.done;
                if(this.sessionDish._id == sessionDishId) {
                    this.close();
                }
            }
        });

        this.userId = this.service.userId;
        
        if(this.sessionDish.people.customer.avatar) {
            this.customerAvatar = getImage(this.sessionDish.people.customer.avatar);
        }
        if(this.sessionDish.people.cook?.avatar) {
            this.cookAvatar = getImage(this.sessionDish.people.cook.avatar);
        }

        const result: any = await this.service.get(`cook/modifiers?dishId=${this.sessionDish.dishId}&sessionDishId=${this.sessionDish._id}`);

        this.modifiers = result.modifiers;
    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
