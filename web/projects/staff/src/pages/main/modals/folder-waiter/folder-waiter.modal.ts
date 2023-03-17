import { CommonModule } from '@angular/common';
import { Component, ViewChild, Input, Output, ViewContainerRef, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConvertedSessionDish, Folder } from 'projects/staff/src/models/order-dishes';
import { DishWaiterComponent } from '../../components/waiter/dish-waiter/dish-waiter.component';

@Component({
    selector: 'app-folder-waiter',
    templateUrl: './folder-waiter.modal.html',
    styleUrls: ['./folder-waiter.modal.scss'],
    standalone: true,
    imports: [CommonModule, DishWaiterComponent, MatIconModule],
})
export class FolderWaiterModal {

    @Input() folder: Folder;
    @Output() leave = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    close() {
        this.leave.emit();
    }

    async openDishModal(dish: ConvertedSessionDish) {
        const { WaiterDishModal } = await import("../waiter-dish/waiter-dish.modal");

        const component = this.modalContainer.createComponent(WaiterDishModal);

        component.instance.sessionDish = dish;

        component.instance.leave.subscribe((served: boolean) => {
            if (served) {
                for (let i in this.folder.dishes) {
                    if (this.folder.dishes[i]._id == dish._id) {
                        this.folder.dishes.splice(+i, 1);
                        break;
                    }
                }

                if (this.folder.dishes.length == 0) {
                    this.leave.emit(true);
                }
            }
            component.destroy();
        });
    }
}
