import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ConvertedSessionItem, Folder } from 'projects/staff/src/models/order-items';
import { ItemCookComponent } from '../../components/cook/item-cook/item-cook.component';

@Component({
    selector: 'app-folder',
    templateUrl: './folder-cook.modal.html',
    styleUrls: ['./folder-cook.modal.scss'],
    standalone: true,
    imports: [CommonModule, ItemCookComponent, MatIconModule],
})
export class FolderCookModal {

    @Input() folder: Folder;
    @Output() leave = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    async openItemModal(item: ConvertedSessionItem) {
        const { CookItemModal } = await import("../cook-item/cook-item.modal");


        const component = this.modalContainer.createComponent(CookItemModal);

        component.instance.sessionItem = item;


        component.instance.leave.subscribe((a: "done" | "taken") => {
            if(a == "taken") {
                for(let i in this.folder.items) {
                    if(this.folder.items[i]._id == item._id) {
                        
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
                for(let i in this.folder.items) {
                    if(this.folder.items[i]._id == item._id) {
                        this.folder.items.splice(+i, 1);
                        break;
                    }
                }
                if(this.folder.items.length == 0) {
                    return this.leave.emit("done");
                }
            } else if(a == "removed") {
                for(let i in this.folder.items) {
                    if(this.folder.items[i]._id == item._id) {
                        this.folder.items.splice(+i, 1);
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
