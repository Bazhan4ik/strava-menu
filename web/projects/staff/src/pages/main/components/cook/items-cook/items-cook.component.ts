import { Component, OnDestroy, OnInit, ViewContainerRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';
import { CookItemsData } from 'projects/staff/src/models/socket-cook-items';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-items-cook',
  templateUrl: './items-cook.component.html',
  styleUrls: ['./items-cook.component.scss']
})
export class ItemsCookComponent implements OnInit, OnDestroy {
    items: ConvertedSessionItem[];
    subscription: Subscription;


    constructor(
        private service: StaffService,
        private socket: SocketService,
        private changeDetector: ChangeDetectorRef,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    async openItemModal(item: ConvertedSessionItem) {
        const { CookItemModal } = await import("../../../modals/cook-item/cook-item.modal");


        const component = this.modalContainer.createComponent(CookItemModal);

        component.instance.sessionItem = item;


        component.instance.leave.subscribe((a: "done" | "taken") => {
            if(a == "taken") {
                for(let i in this.items) {
                    if(this.items[i]._id == item._id) {
                        
                        if(item.takenInterval) {
                            return;
                        }

                        item.takenInterval = setInterval(() => {
                            item.time.taken!.minutes++;
                            if(item.time.taken?.minutes == 60) {
                                item.time.taken.hours++;
                                item.time.taken.minutes = 0;
                            }
                        }, 60000);


                        return;
                    }
                }
            } else if(a == "done") {
                for(let i in this.items) {
                    if(this.items[i]._id == item._id) {
                        this.items.splice(+i, 1);

                        this.changeDetector.detectChanges(); // so item-cook.component's ngOnDestroy called
                        break;
                    }
                }
            } else if(a == "removed") {
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

        this.subscription = this.socket.$cookItems.subscribe(res => {
            if(res.types.includes("items/new")) {
                this.items.push(...res.data as CookItemsData.add);
            } else if(res.types.includes("items/take")) {
                const { sessionId, sessionItemId, cook } = res.data as CookItemsData.take;

                for(let item of this.items) {
                    if(item._id == sessionItemId) {
                        item.status = "cooking";
                        item.people.cook = cook;
                        item.time.taken = { hours: 0, minutes: 0, nextMinute: null! };

                        if(item.takenInterval) {
                            return;
                        }

                        item.takenInterval = setInterval(() => {
                            item.time.taken!.minutes++;
                            if(item.time.taken!.minutes == 60) {
                                item.time.taken!.minutes = 0;
                                item.time.taken!.hours++;
                            }
                        }, 60000);
                    }
                }
            } else if(res.types.includes("items/quit")) {
                const { sessionId, sessionItemId } = res.data as CookItemsData.quit;

                for(let item of this.items) {
                    if(item._id == sessionItemId) {
                        item.status = "ordered";
                        item.time.taken = null!;

                        clearInterval(item.takenInterval);
                        clearInterval(item.takenTimeout);
                        item.takenInterval = null;
                    }
                }
            } else if(res.types.includes("items/done")) {
                const { sessionId, sessionItemId } = res.data as CookItemsData.done;

                for(let i in this.items) {
                    if(this.items[i]._id == sessionItemId) {
                        this.items.splice(+i, 1);
                        break;
                    }
                }

            }
        });
        
        this.items = await this.service.get("cook/items");


        console.log(this.items);



    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
