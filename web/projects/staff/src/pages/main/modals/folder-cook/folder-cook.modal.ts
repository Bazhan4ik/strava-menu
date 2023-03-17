import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConvertedSessionDish, Folder } from 'projects/staff/src/models/order-dishes';
import { DishCookComponent } from '../../components/cook/dish-cook/dish-cook.component';

@Component({
    selector: 'app-folder',
    templateUrl: './folder-cook.modal.html',
    styleUrls: ['./folder-cook.modal.scss'],
    standalone: true,
    imports: [CommonModule, DishCookComponent, MatIconModule],
})
export class FolderCookModal {

    @Input() folder: Folder;
    @Output() leave = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    async openDishModal(dish: ConvertedSessionDish) {
        const { CookDishModal } = await import("../cook-dish/cook-dish.modal");


        const component = this.modalContainer.createComponent(CookDishModal);

        component.instance.sessionDish = dish;


        component.instance.leave.subscribe((a: "done" | "taken") => {
            if(a == "taken") {
                for(let i in this.folder.dishes) {
                    if(this.folder.dishes[i]._id == dish._id) {
                        
                        if(dish.takenInterval) {
                            return;
                        }

                        dish.takenInterval = setInterval(() => {
                            dish.time.taken!.minutes++;
                            if(dish.time.taken?.minutes == 60) {
                                dish.time.taken.hours++;
                                dish.time.taken.minutes = 0;
                            }
                        }, 60000);


                        return;
                    }
                }
            } else if(a == "done") {
                for(let i in this.folder.dishes) {
                    if(this.folder.dishes[i]._id == dish._id) {
                        this.folder.dishes.splice(+i, 1);
                        break;
                    }
                }
                if(this.folder.dishes.length == 0) {
                    return this.leave.emit("done");
                }
            } else if(a == "removed") {
                for(let i in this.folder.dishes) {
                    if(this.folder.dishes[i]._id == dish._id) {
                        this.folder.dishes.splice(+i, 1);
                        break;
                    }
                }
            }

            component.destroy();
        });
    }


    close() {
        this.leave.emit();
    }


}
