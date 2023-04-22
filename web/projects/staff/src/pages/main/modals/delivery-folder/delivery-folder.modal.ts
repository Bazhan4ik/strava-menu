import { CommonModule, } from '@angular/common';
import { Component, ViewChild, EventEmitter, ViewContainerRef, Output, Input, OnInit, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { ItemWaiterComponent } from '../../components/waiter/item-waiter/item-waiter.component';
import { WaiterItemModal } from '../waiter-item/waiter-item.modal';

@Component({
    selector: 'app-delivery-folder',
    templateUrl: './delivery-folder.modal.html',
    styleUrls: ['./delivery-folder.modal.scss'],
    standalone: true,
    imports: [CommonModule, ItemWaiterComponent, MatIconModule]
})
export class DeliveryFolderModal implements OnInit {
    constructor(private service: StaffService,) { };

    @Input() folder: { id: string; canBePickedUp: boolean; deliveryStatus: string; items: ConvertedSessionItem[]; };
    @Output() leave = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;




    ngOnInit() {
    }

    async openModal(item: ConvertedSessionItem) {
        if(item.status != "cooked:disposing") {
            return;
        }

        const component = this.modalContainer.createComponent(WaiterItemModal);

        component.instance.sessionItem = item;

        component.instance.leave.subscribe((served: boolean) => {
            if(served) {
                for(let i in this.folder.items) {
                    if(this.folder.items[i]._id == item._id) {
                        this.folder.items.splice(+i, 1);
                        break;
                    }
                }
                if(this.folder.items.length == 0) {
                    this.leave.emit(true);
                }
            }
            component.destroy();
        });
    }
    async served() {
        const result: any = await this.service.put({ sessionId: this.folder.items[0].sessionId }, "waiter/served/delivery");

        if(result.updated) {
            this.leave.emit(true);
        }
    }

    close() {
        this.leave.emit();
    }
}
