import { Component, OnInit } from '@angular/core';
import { Time } from 'global-models/time';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';


interface Order {
    status: string;
    _id: string;
    total: number;
    dishesAmount: number;
    location: string;
    date: string;

    customer: { name: string; avatar: string; staff: boolean; };
    dishes: {
        name: string;
        price: number;
        image: any;
        status: string;
        cook: { name: string; };
        waiter: { name: string; };
        time: Time;
    }[];
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
            for(let dish of order.dishes) {
                dish.image = getImage(dish.image) || "./../../../../../../../global-resources/images/no-image.svg";
            }
        }


        this.orders = result;

        console.log(result);
    }
}
