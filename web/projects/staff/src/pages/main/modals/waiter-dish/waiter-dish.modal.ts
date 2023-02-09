import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionDish } from 'projects/staff/src/models/order-dishes';
import { StaffService } from 'projects/staff/src/services/staff.service';

@Component({
    selector: 'app-waiter-dish',
    templateUrl: './waiter-dish.modal.html',
    styleUrls: ['./waiter-dish.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class WaiterDishModal implements OnInit {

    cookAvatar: string = "./../../../../../../../global-resources/images/plain-avatar.jpg";
    customerAvatar: string = "./../../../../../../../global-resources/images/plain-avatar.jpg";

    session: { type: string; id: string; };

    constructor(
        private service: StaffService,
    ) {}

    @Input() sessionDish: ConvertedSessionDish;
    @Output() leave = new EventEmitter();

    async served() {
        const update: any = await this.service.put({ sessionId: this.sessionDish.sessionId, sessionDishId: this.sessionDish._id }, "waiter/served");

        if(update.updated) {
            this.leave.emit(true);
        }
    }

    close() {
        this.leave.emit();
    }


    async ngOnInit() {
        if(this.sessionDish.people.cook?.avatar) {
            this.cookAvatar = getImage(this.sessionDish.people.cook?.avatar);
        }
        if(this.sessionDish.people.customer.avatar) {
            this.customerAvatar = getImage(this.sessionDish.people.customer?.avatar);
        }


        const result: any = await this.service.get("waiter/session", this.sessionDish.sessionId);

        this.session = result;

        console.log(result);
    }
}
