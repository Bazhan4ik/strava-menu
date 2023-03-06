import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, ViewContainerRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { StaffService } from 'projects/staff/src/services/staff.service';

interface Dish {
    name: string;
    price: number;
    image: any;
    _id: string;
    comment: string;
    dishId: string;
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

    dishes: Dish[];
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

    async addComment(id: string) {
        const { DishCommentModal } = await import("./../dish-comment/dish-comment.modal");

        let dish: Dish = null!;
        for(const d of this.dishes) {
            if(d._id == id) {
                dish = d;
                break;
            }
        }
        if(!dish) {
            return;
        }

        const component = this.modalContainer.createComponent(DishCommentModal);

        component.instance.comment = dish.comment;

        component.instance.leave.subscribe(async (comment: string) => {
            if(comment) {
                dish.comment = comment;

                const update: any = await this.service.put({ sessionDishId: id, comment }, "order/dish/comment");

                if(!update.updated) {
                    dish.comment = null!;
                }
            }

            component.destroy();
        });
    }

    async removeDish(id: string) {
        this.loading = true;
        for(const d in this.dishes) {
            if(this.dishes[d]._id == id) {
                this.leave.emit({ type: "amount", dishId: this.dishes[d].dishId });
                this.dishes.splice(+d, 1);
                break;
            }
        }

        if(this.dishes.length == 0) {
            this.close();
        }

        const update = await this.service.delete("order", "dish", id);

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
            const result: { dishes: Dish[]; money: Money; order: OrderInfo; } = await this.service.get("order/checkout");

            
            this.order = result.order;
            this.money = result.money;
            this.dishes = [];
            for(const dish of result.dishes) {
                this.dishes.push({
                    ...dish,
                    image: getImage(dish.image) || "./../../../../../../../../global-resources/images/no-image.svg",
                });
            }
    
        } catch (e: any) {
            if(e.status == 400) {
                if(e.error.reason == "InvalidDishes") {
                    this.close();
                }
            }
        }

        this.loading = false;
    }
}
