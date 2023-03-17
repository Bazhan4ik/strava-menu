import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';


interface Order {
    status: string;
    _id: string;
    total: number;
    date: string;
    type: string;
    id: string;
    customer: { name: string; avatar: string; staff: boolean; };
}


@Component({
    selector: 'app-orders',
    templateUrl: './orders.page.html',
    styleUrls: ['./orders.page.scss']
})
export class OrdersPage implements OnInit {
    orders: Order[];

    constructor(
        private service: RestaurantService,
    ) { };




    async ngOnInit() {
        const result: Order[] = await this.service.get("orders");

        if(!result) {
            return;
        }

        for(let order of result) {
            order.customer.avatar = getImage(order.customer.avatar) || "./../../../../../../../global-resources/images/plain-avatar.jpg";
        }


        this.orders = result;

        console.log(result);
    }
}
