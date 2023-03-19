import { CommonModule } from '@angular/common';
import { Component, ViewChild, ViewContainerRef, } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionItem, Folder } from 'projects/staff/src/models/order-items';
import { WaiterItemsData } from 'projects/staff/src/models/socket-waiter-items';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from 'rxjs';



@Component({
    selector: 'app-folders-waiter',
    templateUrl: './folders-waiter.component.html',
    styleUrls: ['./folders-waiter.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class FoldersWaiterComponent {
    folders: Folder[];
    subscription: Subscription;


    constructor(
        private service: StaffService,
        private socket: SocketService,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async openFolder(folder: Folder) {
        const { FolderWaiterModal } = await import("./../../../modals/folder-waiter/folder-waiter.modal");

        const component = this.modalContainer.createComponent(FolderWaiterModal);

        component.instance.folder = folder;

        component.instance.leave.subscribe((d: boolean) => {
            if(d) {
                for(const i in this.folders) {
                    if(this.folders[i].sessionId == folder.sessionId) {
                        this.folders.splice(+i, 1);
                        break;
                    }
                }
            }
            component.destroy();
        });
        
    }


    // async openItemsModal(item: ConvertedSessionItems) {
    //     const { WaiterItemsModal } = await import("../../../modals/waiter-item/waiter-item.modal");

    //     const component = this.modalContainer.createComponent(WaiterItemsModal);

    //     component.instance.sessionItems = item;

    //     component.instance.leave.subscribe((served: boolean) => {
    //         if(served) {
    //             for(const [index, folder] of this.folders.entries()) {
    //                 if(folder.sessionId == item.sessionId) {
    //                     for(let i in folder.items) {
    //                         if(folder.items[i]._id == item._id) {
    //                             folder.items.splice(+i, 1);
    //                             break;
    //                         }
    //                     }
    //                     if(folder.items.length == 0) {
    //                         this.folders.splice(index, 1);
    //                     }
    //                     break;
    //                 }
    //             }
    //         }
    //         component.destroy();
    //     });
    // }



    async ngOnInit() {
        this.subscription = this.socket.$waiterItems.subscribe(res => {
            if(res.types.includes("items/add")) {
                const item = res.data as WaiterItemsData.add;
                
                let addFolder = true;
                for(const folder of this.folders) {
                    if(folder.sessionId == item.sessionId) {
                        addFolder = false;
                        folder.items.push({ ...item, item: { ...item.item, image: getImage(item.item.image) } });
                        break;
                    }
                }
                if(addFolder) {
                    this.folders.push({ type: item.order.type, id: item.order.id, items: [{ ...item, item: { ...item.item, image: getImage(item.item.image) } }], sessionId: item.sessionId });
                }

            } else if(res.types.includes("items/serve")) {
                const { sessionId, sessionItemId } = res.data as WaiterItemsData.serve;

                for(const folder of this.folders) {
                    if(folder.sessionId == sessionId) {
                        for(let i in folder.items) {
                            if(folder.items[i]._id == sessionItemId) {
                                folder.items.splice(+i, 1);
                                break;
                            }
                        }
                    }
                }
            }
        });


        const items: ConvertedSessionItem[] = await this.service.get("waiter/items");

        this.folders = [];

        for(const item of items) {
            let addFolder = true;
            for(const folder of this.folders) {
                if(folder.sessionId == item.sessionId) {
                    addFolder = false;
                    folder.items.push({ ...item, item: { ...item.item, image: getImage(item.item.image) } });
                    break;
                }
            }
            if(addFolder) {
                this.folders.push({ type: item.order.type, id: item.order.id, items: [{ ...item, item: { ...item.item, image: getImage(item.item.image) } }], sessionId: item.sessionId });
            }
        }

    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

}
