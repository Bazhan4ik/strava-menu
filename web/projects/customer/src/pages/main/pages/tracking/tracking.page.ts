import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { Subscription } from 'rxjs';
import { DishesEvent } from '../../models/socket';


interface Dish {
    name: string;
    image: { buffer: any; resolution: number; };
    status: string;
    convertedImage: string;
    _id: string;
}


@Component({
    selector: 'app-tracking',
    templateUrl: './tracking.page.html',
    styleUrls: ['./tracking.page.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule],
})
export class TrackingPage implements OnInit, OnDestroy {
    subscription: Subscription;

    dishes: Dish[];


    constructor(
        private service: CustomerService,
    ) {}



    async ngOnInit() {
        this.subscription = this.service.$dishes.subscribe(data => {
            if(data.types.includes("dishes/status")) {
                const { sessionDishId, status } = data.data as DishesEvent.status;
                for(let dish of this.dishes) {
                    if(dish._id == sessionDishId) {
                        dish.status = status;
                        break;
                    }
                }
            }
        });


        const result: Dish[] = await this.service.get({}, "tracking");

        console.log(result);

        if(result) {
            this.dishes = [];

            for(let dish of result) {
                dish.convertedImage = getImage(dish.image.buffer) || "./../../../../../../../global-resources/images/no-image.svg";
            }
        }

        this.dishes = result;
    }
    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}
