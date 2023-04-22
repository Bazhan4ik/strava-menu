import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, ViewContainerRef, ViewChild } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionItem, Folder } from 'projects/staff/src/models/order-items';
import { CookItemsData } from 'projects/staff/src/models/socket-cook-items';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from "rxjs";


@Component({
    selector: 'app-folders-cook',
    templateUrl: './folders-cook.component.html',
    styleUrls: ['./folders-cook.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class FoldersCookComponent {
    folders: Folder[];
    subscription: Subscription;


    constructor(
        private service: StaffService,
        private socket: SocketService,
        private changeDetector: ChangeDetectorRef,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    

    async openFolder(folder: Folder) {
        const { FolderCookModal } = await import("../../../modals/folder-cook/folder-cook.modal");

        const component = this.modalContainer.createComponent(FolderCookModal);

        component.instance.folder = folder;

        component.instance.leave.subscribe((a: string) => {
            component.destroy();
            if(a == "done") {
                for(const i in this.folders) {
                    if(this.folders[i].sessionId == folder.sessionId) {
                        this.folders.splice(+i, 1);
                        break;
                    }
                }
            }
        });
    }


    async ngOnInit() {

        this.subscription = this.socket.$cookItems.subscribe(res => {
            if(res.types.includes("items/new")) {
                const items = res.data as CookItemsData.add;

                this.folders.push({
                    items: items.map(item => { return {...item, item: { ...item.item, image: getImage(item.item.image) } } }),
                    type: items[0].order.type,
                    id: items[0].order.id,
                    sessionId: items[0].sessionId,
                });
            } else if(res.types.includes("items/take")) {
                const { sessionId, sessionItemId, cook } = res.data as CookItemsData.take;

                for(const folder of this.folders) {
                    if(folder.sessionId == sessionId) {
                        for(let item of folder.items) {
                            if(item._id == sessionItemId) {
                                item.status = "cooking";
                                item.people!.cook = cook;
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
                        break;
                    }
                }
            } else if(res.types.includes("items/quit")) {
                const { sessionId, sessionItemId } = res.data as CookItemsData.quit;

                for(const folder of this.folders) {
                    if(folder.sessionId == sessionId) {
                        for(let item of folder.items) {
                            if(item._id == sessionItemId) {
                                item.status = "ordered";
                                item.time.taken = null!;
        
                                clearInterval(item.takenInterval);
                                clearInterval(item.takenTimeout);
                                item.takenInterval = null;
                                break;
                            }
                        }
                        break;
                    }
                }

            } else if(res.types.includes("items/done")) {
                const { sessionId, sessionItemId } = res.data as CookItemsData.done;

                for(const [index, folder] of this.folders.entries()) {
                    if(folder.sessionId == sessionId) {
                        for(let i in folder.items) {
                            if(folder.items[i]._id == sessionItemId) {
                                folder.items.splice(+i, 1);
                                break;
                            }
                        }
                        if(folder.items.length == 0) {
                            this.folders.splice(index, 1);
                        }
                        break;
                    }
                }


            }
        });
        
        const items: ConvertedSessionItem[] = await this.service.get("cook/items");

        this.folders = [];

        for(const item of items) {
            let addFolder = true;
            for(const folder of this.folders) {
                if(folder.sessionId == item.sessionId) {
                    folder.items.push({...item, item: { ...item.item, image: getImage(item.item.image) } });
                    addFolder = false;
                    break;
                }
            }
            if(addFolder) {
                this.folders.push({ items: [{...item, item: { ...item.item, image: getImage(item.item.image) } }], type: item.order.type, id: item.order.id, sessionId: item.sessionId });
            }
        }


        console.log(items);
    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
