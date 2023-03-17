import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, ViewContainerRef, ViewChild } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionDish, Folder } from 'projects/staff/src/models/order-dishes';
import { CookDishesData } from 'projects/staff/src/models/socket-cook-dishes';
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

        this.subscription = this.socket.$cookDishes.subscribe(res => {
            if(res.types.includes("dishes/new")) {
                const dishes = res.data as CookDishesData.add;

                this.folders.push({
                    dishes: dishes.map(dish => { return {...dish, dish: { ...dish.dish, image: getImage(dish.dish.image) } } }),
                    type: dishes[0].order.type,
                    id: dishes[0].order.id,
                    sessionId: dishes[0].sessionId,
                });
            } else if(res.types.includes("dishes/take")) {
                const { sessionId, sessionDishId, cook } = res.data as CookDishesData.take;

                for(const folder of this.folders) {
                    if(folder.sessionId == sessionId) {
                        for(let dish of folder.dishes) {
                            if(dish._id == sessionDishId) {
                                dish.status = "cooking";
                                dish.people.cook = cook;
                                dish.time.taken = { hours: 0, minutes: 0, nextMinute: null! };
        
                                if(dish.takenInterval) {
                                    return;
                                }
        
                                dish.takenInterval = setInterval(() => {
                                    dish.time.taken!.minutes++;
                                    if(dish.time.taken!.minutes == 60) {
                                        dish.time.taken!.minutes = 0;
                                        dish.time.taken!.hours++;
                                    }
                                }, 60000);
                            }
                        }
                        break;
                    }
                }
            } else if(res.types.includes("dishes/quit")) {
                const { sessionId, sessionDishId } = res.data as CookDishesData.quit;

                for(const folder of this.folders) {
                    if(folder.sessionId == sessionId) {
                        for(let dish of folder.dishes) {
                            if(dish._id == sessionDishId) {
                                dish.status = "ordered";
                                dish.time.taken = null!;
        
                                clearInterval(dish.takenInterval);
                                clearInterval(dish.takenTimeout);
                                dish.takenInterval = null;
                                break;
                            }
                        }
                        break;
                    }
                }

            } else if(res.types.includes("dishes/done")) {
                const { sessionId, sessionDishId } = res.data as CookDishesData.done;

                for(const [index, folder] of this.folders.entries()) {
                    if(folder.sessionId == sessionId) {
                        for(let i in folder.dishes) {
                            if(folder.dishes[i]._id == sessionDishId) {
                                folder.dishes.splice(+i, 1);
                                break;
                            }
                        }
                        if(folder.dishes.length == 0) {
                            this.folders.splice(index, 1);
                        }
                        break;
                    }
                }


            }
        });
        
        const dishes: ConvertedSessionDish[] = await this.service.get("cook/dishes");

        this.folders = [];

        for(const dish of dishes) {
            let addFolder = true;
            for(const folder of this.folders) {
                if(folder.sessionId == dish.sessionId) {
                    folder.dishes.push({...dish, dish: { ...dish.dish, image: getImage(dish.dish.image) } });
                    addFolder = false;
                    break;
                }
            }
            if(addFolder) {
                this.folders.push({ dishes: [{...dish, dish: { ...dish.dish, image: getImage(dish.dish.image) } }], type: dish.order.type, id: dish.order.id, sessionId: dish.sessionId });
            }
        }


        console.log(dishes);
    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }
}
