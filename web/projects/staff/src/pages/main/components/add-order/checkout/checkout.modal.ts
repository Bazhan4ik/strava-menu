import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, ViewContainerRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { StaffService } from 'projects/staff/src/services/staff.service';

interface Item {
    name: string;
    price: number;
    image: any;
    _id: string;
    comment: string;
    itemId: string;
}
interface Money {
    total: number;
    subtotal: number;
    hst: number;
    service: number;
    tip: number;
}
interface OrderInfo {
    id: string;
    type: "dinein" | "takeout";
}

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.modal.html',
    styleUrls: ['./checkout.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class CheckoutModal implements OnInit {

    items: Item[];
    money: Money;
    order: OrderInfo;

    loading = false;

    constructor(
        private service: StaffService,
    ) { };

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @Output() leave = new EventEmitter();


    close() {
        this.leave.emit();
    }

    async changeModifiers(itemId: string, sessionItemId: string) {
        this.loading = true;
        const { ModifiersComponent } = await import("./../modifiers/modifiers.component");

        const component = this.modalContainer.createComponent(ModifiersComponent);

        const result: any = await this.service.get(`order/modifiers/${itemId}?sessionItemId=${sessionItemId}`)

        component.instance.modifiers = result.modifiers;

        this.loading = false;

        component.instance.leave.subscribe(async (m: any) => {
            if(m) {
                this.loading = true;

                const result: any = await this.service.put({ modifiers: m }, `order/item/modifiers?sessionItemId=${sessionItemId}&itemId=${itemId}`);

                if(result.updated) {
                    this.ngOnInit();
                }

            }
            component.destroy();
        });
    }

    async addComment(id: string) {
        const { ItemCommentModal } = await import("../item-comment/item-comment.modal");

        let item: Item = null!;
        for(const d of this.items) {
            if(d._id == id) {
                item = d;
                break;
            }
        }
        if(!item) {
            return;
        }

        const component = this.modalContainer.createComponent(ItemCommentModal);

        component.instance.comment = item.comment;

        component.instance.leave.subscribe(async (comment: string) => {
            if(comment) {
                item.comment = comment;

                const update: any = await this.service.put({ sessionItemId: id, comment }, "order/item/comment");

                if(!update.updated) {
                    item.comment = null!;
                }
            }

            component.destroy();
        });
    }

    async removeItem(id: string) {
        this.loading = true;
        for(const d in this.items) {
            if(this.items[d]._id == id) {
                this.leave.emit({ type: "amount", itemId: this.items[d].itemId });
                this.items.splice(+d, 1);
                break;
            }
        }

        if(this.items.length == 0) {
            this.close();
        }

        const update = await this.service.delete("order", "item", id);

        this.ngOnInit();
    }

    async payed() {
        if(!this.order.id) {
            return;
        }
        this.loading = true;
        
        const result: any = await this.service.post({}, "order/payed");

        if(result.updated) {
            this.leave.emit({ type: "payed" });
        }

        this.loading = false;
    }

    async selectTable() {
        const { SelectTableModal } = await import("./../select-table/select-table.modal");

        const component = this.modalContainer.createComponent(SelectTableModal);

        component.instance.leave.subscribe((table: number) => {
            if(table) {
                this.order.id = table.toString();
            }
            component.destroy();
        });
    }

    async ngOnInit() {
        try {
            const result: { items: Item[]; money: Money; order: OrderInfo; } = await this.service.get("order/checkout");

            
            this.order = result.order;
            this.money = result.money;
            this.items = [];
            for(const item of result.items) {
                this.items.push({
                    ...item,
                    image: getImage(item.image) || "./../../../../../../../../global-resources/images/no-image.svg",
                });
            }
    
        } catch (e: any) {
            if(e.status == 400) {
                if(e.error.reason == "InvalidItems") {
                    this.close();
                }
            }
        }

        this.loading = false;
    }
}
