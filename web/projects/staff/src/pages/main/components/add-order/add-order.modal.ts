import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild, ViewContainerRef, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { firstValueFrom } from 'rxjs';
import { ModifiersComponent } from './modifiers/modifiers.component';


interface Item {
    image: any;
    id: string;
    amount: number;
    _id: string;
    hasModifiers: boolean;
    info: {
        name: string;
        price: number;
    }
}

interface Collection {
    name: string;
    id: string;
    image: any;
    open: boolean;
    items: string[];
}

interface Folder {
    name: string;
    open: boolean;
    id: string;
    _id: string;
    collections: Collection[];
}



@Component({
    selector: 'app-add-order',
    templateUrl: './add-order.modal.html',
    styleUrls: ['./add-order.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class AddOrderModal implements OnInit {
    
    itemsSelected: number;
    folders: Folder[];
    loading = false;
    items: { [itemId: string]: Item };

    constructor(
        private service: StaffService,
        private socket: SocketService,
    ) { };


    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @Output() leave = new EventEmitter();


    close() {
        this.leave.emit();
    }

    openFolder(fi: number) {
        this.folders[fi].open = !!!this.folders[fi].open;
    }
    openCollection(fi: number, ci: number) {
        this.folders[fi].collections[ci].open = !!!this.folders[fi].collections[ci].open;
    }

    getModifiers(itemId: string) {
        return new Promise(async resolve => {
            this.loading = true;

            const result: any = await this.service.get("order/modifiers", itemId);

            const component = this.modalContainer.createComponent(ModifiersComponent);

            component.instance.modifiers = result.modifiers;

            this.loading = false;

            component.instance.leave.subscribe((m: any) => {
                component.destroy();
                if(!m) {
                    resolve(null);
                    return;
                }
                resolve(m);
            });
        });
    }

    async addItem(itemId: string, comment?: string) {

        const item = this.items[itemId];
        
        let modifiers: any = [];

        if(item.hasModifiers) {
            modifiers = await this.getModifiers(itemId);

            if(!modifiers) {
                return;
            }
        }

        const update: any = await this.service.post({ itemId, comment, modifiers }, "order/item");

        this.items[itemId].amount++;
        this.itemsSelected++;

        if(!update.updated) {
            this.items[itemId].amount--;
            this.itemsSelected--;
        }
    }
    async addComment(itemId: string) {
        const { ItemCommentModal } = await import("./item-comment/item-comment.modal");

        const component = this.modalContainer.createComponent(ItemCommentModal);

        component.instance.leave.subscribe((comment: string) => {
            if(comment) {
                this.addItem(itemId, comment);
            }
            component.destroy();
        });
    }


    async goCheckout() {
        const { CheckoutModal } = await import("./checkout/checkout.modal");

        const component = this.modalContainer.createComponent(CheckoutModal);

        component.instance.leave.subscribe((a: { type: string; itemId: string; }) => {
            if(a?.type == "amount") {
                this.itemsSelected--;
                this.items[a.itemId].amount--;
                return;
            } else if(a?.type == "payed") {
                this.close();
            }
            component.destroy();
        });
    }


    async ngOnInit() {
        const result: { folders: Folder[]; items: any; itemsSelected: number; } = await this.service.initManualOrdering(await firstValueFrom(this.socket.socketId()));

        this.folders = result.folders;
        this.items = result.items;
        this.itemsSelected = result.itemsSelected;

        for(const id of Object.keys(this.items)) {
            this.items[id].image = getImage(this.items[id].image) || "./../../../../../../../global-resources/images/no-image.svg";
        }
    }
}
