import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';
import { StaffService } from 'projects/staff/src/services/staff.service';

@Component({
    selector: 'app-waiter-item',
    templateUrl: './waiter-item.modal.html',
    styleUrls: ['./waiter-item.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class WaiterItemModal implements OnInit {
    constructor(
        private service: StaffService,
    ) { };

    cookAvatar: string = "./../../../../../../../global-resources/images/plain-avatar.jpg";
    customerAvatar: string = "./../../../../../../../global-resources/images/plain-avatar.jpg";
    session: { type: string; id: string; };
    modifiers: { name: string; selected: string[] }[];


    @Input() sessionItem: ConvertedSessionItem;
    @Output() leave = new EventEmitter();




    async ngOnInit() {
        if(this.sessionItem.people?.cook?.avatar) {
            this.cookAvatar = getImage(this.sessionItem.people?.cook?.avatar);
        }
        if(this.sessionItem.people?.customer?.avatar) {
            this.customerAvatar = getImage(this.sessionItem.people.customer?.avatar);
        }


        const result: any = await this.service.get(`waiter/session?itemId=${this.sessionItem.itemId}&sessionItemId=${this.sessionItem._id}`);

        this.session = result.session;
        this.modifiers = result.modifiers;
    }

    close() {
        this.leave.emit();
    }
    async served() {
        const update: any = await this.service.put({ sessionId: this.sessionItem.sessionId, sessionItemId: this.sessionItem._id }, "waiter/served");

        if(update.updated) {
            this.leave.emit(true);
        }
    }
    async disposed() {
        const update: any = await this.service.put({ sessionId: this.sessionItem.sessionId, sessionItemId: this.sessionItem._id }, "waiter/disposed");

        if(update.updated) {
            this.leave.emit(true);
        }
    }
}