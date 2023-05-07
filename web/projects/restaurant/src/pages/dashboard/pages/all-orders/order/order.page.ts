import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { env } from 'environment/environment';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';


interface Order {
    customer: { name: string; };
    type: string;
    id: string;
    _id: string;
    money: { total: number; tax: number; taxTitle: number; subtotal: number; service: number; tip: number; };
    method: "card" | "cash";
    date: string;
    status: string;
    location: string;
    items: {
        image: string;
        name: string;
        price: number;
        modifiers: number;
        hasImage: boolean;
        id: string;
        staff: {
            waiter: { name: string; };
            cook: { name: string; };
        }
    }[];
}

@Component({
    selector: 'app-order',
    templateUrl: './order.page.html',
    styleUrls: ['./order.page.scss']
})
export class OrderPage implements OnInit {

    order: Order;

    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
        private router: Router,
    ) {}



    async ngOnInit() {
        const orderId = this.route.snapshot.paramMap.get("orderId");

        if(!orderId || orderId.length != 24) {
            this.router.navigate([this.service.restaurant.id, "orders"]);
            return;
        }

        const result: { order: Order } = await this.service.get("orders", orderId);

        for(const item of result.order.items) {
            if(item.hasImage) {
                item.image = `${env.apiUrl}/restaurants/${this.service.restaurant._id}/menu/items/${item.id}/image`;
            } else {
                item.image = "./../../../../../../../../global-resources/images/no-image.svg";
            }
        }

        this.order = result.order;
    }
}
