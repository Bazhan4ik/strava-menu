import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, } from '@angular/core';
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

    constructor(
        private service: StaffService,
        private socket: SocketService,
    ) {}


    @Input() sessionDish: ConvertedSessionDish;
    @Output() leave = new EventEmitter();


    close() {
        this.leave.emit();
    }

    async take() {
        const update: any = await this.service.put({ sessionId: this.sessionDish.sessionId, sessionDishId: this.sessionDish._id }, "cook/take");

        if(update.updated) {
            this.sessionDish.status = "cooking";
            this.sessionDish.people.cook = update.cook;
            this.sessionDish.time.taken = update.time;
        }

        this.leave.emit("taken");
    }

    async quit() {
        const update: any = await this.service.put({ sessionId: this.sessionDish.sessionId, sessionDishId: this.sessionDish._id }, "cook/quit");

        if(update.updated) {
            this.sessionDish.status = "ordered";
            this.sessionDish.people.cook = null!;
            this.sessionDish.time.taken = null!;

            clearInterval(this.sessionDish.takenInterval);
            clearTimeout(this.sessionDish.takenTimeout);
            this.sessionDish.takenInterval = null;
        }
    }

    async done() {
        const update: any = await this.service.put({ sessionId: this.sessionDish.sessionId, sessionDishId: this.sessionDish._id }, "cook/done");

        if(update.updated) {
            this.leave.emit("done");
        }
    }



    ngOnInit() {
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

    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
