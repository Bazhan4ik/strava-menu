import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewChild, ViewContainerRef, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';
import { firstValueFrom } from 'rxjs';
import { ModifiersComponent } from './modifiers/modifiers.component';


interface Dish {
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
    dishes: string[];
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
    
    dishesSelected: number;
    folders: Folder[];
    loading = false;
    dishes: { [dishId: string]: Dish };

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

    getModifiers(dishId: string) {
        return new Promise(async resolve => {
            this.loading = true;

            const result: any = await this.service.get("order/modifiers", dishId);

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

    async addDish(dishId: string, comment?: string) {

        const dish = this.dishes[dishId];
        
        let modifiers: any = [];

        if(dish.hasModifiers) {
            modifiers = await this.getModifiers(dishId);

            if(!modifiers) {
                return;
            }
        }

        const update: any = await this.service.post({ dishId, comment, modifiers }, "order/dish");

        this.dishes[dishId].amount++;
        this.dishesSelected++;

        if(!update.updated) {
            this.dishes[dishId].amount--;
            this.dishesSelected--;
        }
    }
    async addComment(dishId: string) {
        const { DishCommentModal } = await import("./dish-comment/dish-comment.modal");

        const component = this.modalContainer.createComponent(DishCommentModal);

        component.instance.leave.subscribe((comment: string) => {
            if(comment) {
                this.addDish(dishId, comment);
            }
            component.destroy();
        });
    }


    async goCheckout() {
        const { CheckoutModal } = await import("./checkout/checkout.modal");

        const component = this.modalContainer.createComponent(CheckoutModal);

        component.instance.leave.subscribe((a: { type: string; dishId: string; }) => {
            if(a?.type == "amount") {
                this.dishesSelected--;
                this.dishes[a.dishId].amount--;
                return;
            } else if(a?.type == "payed") {
                this.close();
            }
            component.destroy();
        });
    }


    async ngOnInit() {
        const result: { folders: Folder[]; dishes: any; dishesSelected: number; } = await this.service.initManualOrdering(await firstValueFrom(this.socket.socketId()));

        this.folders = result.folders;
        this.dishes = result.dishes;
        this.dishesSelected = result.dishesSelected;

        for(const id of Object.keys(this.dishes)) {
            this.dishes[id].image = getImage(this.dishes[id].image) || "./../../../../../../../global-resources/images/no-image.svg";
        }
    }
}
