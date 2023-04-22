import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewContainerRef, ViewChild } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';
import { WaiterItemsData } from 'projects/staff/src/models/socket-waiter-items';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from "rxjs";
import { DeliveryFolderComponent } from '../delivery-folder/delivery-folder.component';
import { ItemWaiterComponent } from '../item-waiter/item-waiter.component';
import { DeliveryEventData } from 'projects/staff/src/models/socket-delivery';


interface DeliveryFolder {
    id: string;
    items: ConvertedSessionItem[];
    canBePickedUp: boolean;
    deliveryStatus: string;
}


@Component({
    selector: 'app-items-waiter',
    templateUrl: './items-waiter.component.html',
    styleUrls: ['./items-waiter.component.scss'],
    standalone: true,
    imports: [CommonModule, ItemWaiterComponent, DeliveryFolderComponent]
})
export class ItemsWaiterComponent implements OnInit, OnDestroy {
    items: ConvertedSessionItem[];
    subscriptions: Subscription[] = [];
    deliveryFolders: DeliveryFolder[];


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
    async openDeliveryFolder(folder: DeliveryFolder) {
        const { DeliveryFolderModal } = await import("./../../../modals/delivery-folder/delivery-folder.modal");

        const component = this.modalContainer.createComponent(DeliveryFolderModal);

        component.instance.folder = folder;

        component.instance.leave.subscribe((remove: boolean) => {
            if(remove) {
                for(const i in this.deliveryFolders) {
                    if(this.deliveryFolders[i].id == folder.id) {
                        this.deliveryFolders.splice(+i, 1);
                        break;
                    }
                }
            }
            component.destroy();
        });
    }


    async ngOnInit() {
        this.subscriptions.push(
            this.socket.$waiterItems.subscribe(res => {
                if(res.types.includes("items/add")) {
                    const item = res.data as WaiterItemsData.add;
                    if(item.order.type != "delivery") {
                        this.items.push(item);
                        return;
                    }
                    
                    for(const folder of this.deliveryFolders) {
                        if(folder.id == item.order.id) {
                            folder.items.push({ ...item, item: { ...item.item, image: getImage(item.item.image) } });
                            return;
                        }
                    }

                    this.deliveryFolders.push({ deliveryStatus: "", canBePickedUp: false, id: item.order.id, items: [{ ...item, item: { ...item.item, image: getImage(item.item.image) } }]})

                } else if(res.types.includes("items/serve")) {
                    const { sessionId, sessionItemId } = res.data as WaiterItemsData.serve;

                    for(let i in this.items) {
                        if(this.items[i]._id == sessionItemId) {
                            this.items.splice(+i, 1);
                            break;
                        }
                    }
                } else if(res.types.includes("items/dispose")) {
                    const { sessionId, sessionItemId } = res.data as WaiterItemsData.dispose;

                    if(sessionItemId) {
                        for(let i in this.items) {
                            if(this.items[i]._id == sessionItemId) {
                                this.items[i].status = "cooked:disposing";
                                break;
                            }
                        }
                        for(const folder of this.deliveryFolders) {
                            for(let i in folder.items) {
                                if(folder.items[i]._id == sessionItemId) {
                                    folder.items[i].status = "cooked:disposing";
                                    break;
                                }
                            }
                        }
                        return;
                    }

                    // set dishes statuses to disposing
                    for(const folder of this.deliveryFolders) {
                        if(folder.items[0].sessionId == sessionId) {
                            for(const item of folder.items) {
                                item.status = "cooked:disposing";
                            }
                        }
                    }
                } else if(res.types.includes("items/remove")) {
                    const { sessionId, sessionItemId } = res.data as WaiterItemsData.remove;

                    for(let i in this.items) {
                        if(this.items[i]._id == sessionItemId) {
                            this.items.splice(+i, 1);
                            break;
                        }
                    }
                    for(let i in this.deliveryFolders) {
                        for(let j in this.deliveryFolders[i].items) {
                            if(this.deliveryFolders[i].items[j]._id == sessionItemId) {
                                this.deliveryFolders[i].items.splice(+j, 1);
                                if(this.deliveryFolders[i].items.length == 0) {
                                    this.deliveryFolders.splice(+i, 1);
                                }
                                break;
                            }
                        }
                    }
                }
            }),
            this.socket.$delivery.subscribe(res => {
                if(res.types.includes("delivery/status")) {
                    const { sessionId, deliveryStatus, canBePickedUp } = res.data as DeliveryEventData.status;

                    for(const folder of this.deliveryFolders) {
                        if(folder.items[0].sessionId == sessionId) {
                            folder.canBePickedUp = canBePickedUp;
                            folder.deliveryStatus = deliveryStatus;
                            break;
                        }
                    }
                } else if(res.types.includes("delivery/picked-up")) {
                    const { sessionId } = res.data as DeliveryEventData.pickedup;

                    for(let i in this.deliveryFolders) {
                        if(this.deliveryFolders[i].items[0].sessionId == sessionId) {
                            this.deliveryFolders.splice(+i, 1);
                            break;
                        }
                    }
                }
            })
        );
        


        const result: ConvertedSessionItem[] = await this.service.get("waiter/items");


        this.items = [];
        this.deliveryFolders = [];
        for(const item of result) {
            if(item.order.type == "delivery") {
                let add = true;
                for(const folder of this.deliveryFolders) {
                    if(folder.id == item.order.id) {
                        folder.items.push({ ...item, item: { ...item.item, image: getImage(item.item.image) } });
                        add = false;
                        break;
                    }
                }
                if(add) {
                    this.deliveryFolders.push({
                        id: item.order.id,
                        deliveryStatus: "",
                        canBePickedUp: false,
                        items: [{ ...item, item: { ...item.item, image: getImage(item.item.image) } }],
                    });
                }
                continue;
            }
            this.items.push(item);
        }
    }
    ngOnDestroy() {
        for(const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }
}
