import { CommonModule } from '@angular/common';
import { Component, ViewChild, Input, Output, ViewContainerRef, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConvertedSessionItem, Folder } from 'projects/staff/src/models/order-items';
import { ItemWaiterComponent } from '../../components/waiter/item-waiter/item-waiter.component';

@Component({
    selector: 'app-folder-waiter',
    templateUrl: './folder-waiter.modal.html',
    styleUrls: ['./folder-waiter.modal.scss'],
    standalone: true,
    imports: [CommonModule, ItemWaiterComponent, MatIconModule],
})
export class FolderWaiterModal {

    @Input() folder: Folder;
    @Output() leave = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    close() {
        this.leave.emit();
    }

    async openItemModal(item: ConvertedSessionItem) {
        const { WaiterItemModal } = await import("../waiter-item/waiter-item.modal");

        const component = this.modalContainer.createComponent(WaiterItemModal);

        component.instance.sessionItem = item;

        component.instance.leave.subscribe((served: boolean) => {
            if (served) {
                for (let i in this.folder.items) {
                    if (this.folder.items[i]._id == item._id) {
                        this.folder.items.splice(+i, 1);
                        break;
                    }
                }

                if (this.folder.items.length == 0) {
                    this.leave.emit(true);
                }
            }
            component.destroy();
        });
    }
}
