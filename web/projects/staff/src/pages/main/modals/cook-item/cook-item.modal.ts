import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';
import { CookItemsData } from 'projects/staff/src/models/socket-cook-items';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-cook-item',
    templateUrl: './cook-item.modal.html',
    styleUrls: ['./cook-item.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class CookItemModal implements OnInit, OnDestroy {

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


    @Input() sessionItem: ConvertedSessionItem;
    @Output() leave = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    close() {
        this.leave.emit();
    }

    async take() {
        this.disableButtons = true;
        const update: any = await this.service.put({ sessionId: this.sessionItem.sessionId, sessionItemId: this.sessionItem._id }, "cook/take");

        if(update.updated) {
            this.sessionItem.status = "cooking";
            this.sessionItem.people.cook = update.cook;
            this.sessionItem.time.taken = update.time;
            this.leave.emit("taken");
        }

        this.disableButtons = false;
    }

    async quit() {
        this.disableButtons = true;
        const update: any = await this.service.put({ sessionId: this.sessionItem.sessionId, sessionItemId: this.sessionItem._id }, "cook/quit");

        if(update.updated) {
            this.sessionItem.status = "ordered";
            this.sessionItem.people.cook = null!;
            this.sessionItem.time.taken = null!;

            clearInterval(this.sessionItem.takenInterval);
            clearTimeout(this.sessionItem.takenTimeout);
            this.sessionItem.takenInterval = null;
        }
        this.disableButtons = false;
    }

    async done() {
        this.disableButtons = true;
        const update: any = await this.service.put({ sessionId: this.sessionItem.sessionId, sessionItemId: this.sessionItem._id }, "cook/done");

        if(update.updated) {
            this.leave.emit("done");
            return;
        }
        this.disableButtons = false;
    }

    async remove() {
        this.disableButtons = true;
        const { RemoveItemModal } = await import("../remove-item/remove-item.modal");

        const component = this.modalContainer.createComponent(RemoveItemModal);

        component.instance.leave.subscribe(async (reason: string) => {
            component.destroy();

            if(reason) {

                const update: any = await this.service.put({
                    sessionId: this.sessionItem.sessionId,
                    sessionItemId: this.sessionItem._id,
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
        this.subscription = this.socket.$cookItems.subscribe(res => {
            if(res.types.includes("items/done")) {
                const { sessionItemId } = res.data as CookItemsData.done;
                if(this.sessionItem._id == sessionItemId) {
                    this.close();
                }
            }
        });

        this.userId = this.service.userId;
        
        if(this.sessionItem.people.customer.avatar) {
            this.customerAvatar = getImage(this.sessionItem.people.customer.avatar);
        }
        if(this.sessionItem.people.cook?.avatar) {
            this.cookAvatar = getImage(this.sessionItem.people.cook.avatar);
        }

        const result: any = await this.service.get(`cook/modifiers?itemId=${this.sessionItem.itemId}&sessionItemId=${this.sessionItem._id}`);

        this.modifiers = result.modifiers;
    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
