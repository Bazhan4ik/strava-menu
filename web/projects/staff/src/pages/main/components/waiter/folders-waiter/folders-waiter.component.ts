import { CommonModule } from '@angular/common';
import { Component, ViewChild, ViewContainerRef, } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionDish, Folder } from 'projects/staff/src/models/order-dishes';
import { WaiterDishesData } from 'projects/staff/src/models/socket-waiter-dishes';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { Subscription } from 'rxjs';
import { DishWaiterComponent } from '../dish-waiter/dish-waiter.component';



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


    // async openDishModal(dish: ConvertedSessionDish) {
    //     const { WaiterDishModal } = await import("../../../modals/waiter-dish/waiter-dish.modal");

    //     const component = this.modalContainer.createComponent(WaiterDishModal);

    //     component.instance.sessionDish = dish;

    //     component.instance.leave.subscribe((served: boolean) => {
    //         if(served) {
    //             for(const [index, folder] of this.folders.entries()) {
    //                 if(folder.sessionId == dish.sessionId) {
    //                     for(let i in folder.dishes) {
    //                         if(folder.dishes[i]._id == dish._id) {
    //                             folder.dishes.splice(+i, 1);
    //                             break;
    //                         }
    //                     }
    //                     if(folder.dishes.length == 0) {
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
        this.subscription = this.socket.$waiterDishes.subscribe(res => {
            if(res.types.includes("dishes/add")) {
                const dish = res.data as WaiterDishesData.add;
                
                let addFolder = true;
                for(const folder of this.folders) {
                    if(folder.sessionId == dish.sessionId) {
                        addFolder = false;
                        folder.dishes.push({ ...dish, dish: { ...dish.dish, image: getImage(dish.dish.image) } });
                        break;
                    }
                }
                if(addFolder) {
                    this.folders.push({ type: dish.order.type, id: dish.order.id, dishes: [{ ...dish, dish: { ...dish.dish, image: getImage(dish.dish.image) } }], sessionId: dish.sessionId });
                }

            } else if(res.types.includes("dishes/serve")) {
                const { sessionId, sessionDishId } = res.data as WaiterDishesData.serve;

                for(const folder of this.folders) {
                    if(folder.sessionId == sessionId) {
                        for(let i in folder.dishes) {
                            if(folder.dishes[i]._id == sessionDishId) {
                                folder.dishes.splice(+i, 1);
                                break;
                            }
                        }
                    }
                }
            }
        });


        const dishes: ConvertedSessionDish[] = await this.service.get("waiter/dishes");

        this.folders = [];

        for(const dish of dishes) {
            let addFolder = true;
            for(const folder of this.folders) {
                if(folder.sessionId == dish.sessionId) {
                    addFolder = false;
                    folder.dishes.push({ ...dish, dish: { ...dish.dish, image: getImage(dish.dish.image) } });
                    break;
                }
            }
            if(addFolder) {
                this.folders.push({ type: dish.order.type, id: dish.order.id, dishes: [{ ...dish, dish: { ...dish.dish, image: getImage(dish.dish.image) } }], sessionId: dish.sessionId });
            }
        }

    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

}
