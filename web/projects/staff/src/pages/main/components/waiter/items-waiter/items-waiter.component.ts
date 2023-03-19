import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';
import { WaiterItemsData } from 'projects/staff/src/models/socket-waiter-items';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from "rxjs";
import { ItemWaiterComponent } from '../item-waiter/item-waiter.component';

@Component({
    selector: 'app-items-waiter',
    templateUrl: './items-waiter.component.html',
    styleUrls: ['./items-waiter.component.scss'],
    standalone: true,
    imports: [CommonModule, ItemWaiterComponent]
})
export class ItemsWaiterComponent implements OnInit, OnDestroy {
    items: ConvertedSessionItem[];
    subscription: Subscription;


    constructor(
        private service: StaffService,
        private socket: SocketService,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async openItemModal(item: ConvertedSessionItem) {
        const { WaiterItemModal } = await import("../../../modals/waiter-item/waiter-item.modal");

        const component = this.modalContainer.createComponent(WaiterItemModal);

        component.instance.sessionItem = item;

        component.instance.leave.subscribe((served: boolean) => {
            if(served) {
                for(let i in this.items) {
                    if(this.items[i]._id == item._id) {
                        this.items.splice(+i, 1);
                        break;
                    }
                }
            }
            component.destroy();
        });
    }



    async ngOnInit() {
        this.subscription = this.socket.$waiterItems.subscribe(res => {
            console.log(res);
            if(res.types.includes("items/add")) {
                this.items.push(res.data as WaiterItemsData.add);
            } else if(res.types.includes("items/serve")) {
                const { sessionId, sessionItemId } = res.data as WaiterItemsData.serve;

                for(let i in this.items) {
                    if(this.items[i]._id == sessionItemId) {
                        this.items.splice(+i, 1);
                        break;
                    }
                }
            }
        });


        const result: ConvertedSessionItem[] = await this.service.get("waiter/items");

        this.items = result;
    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
