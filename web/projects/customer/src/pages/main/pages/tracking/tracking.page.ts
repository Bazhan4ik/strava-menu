import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Subscription } from 'rxjs';
import { DishesEvent } from '../../models/socket';


interface Dish {
    name: string;
    status: string;
    imageUrl: string;
    dishId: string;
    _id: string;
}


@Component({
    selector: 'app-tracking',
    templateUrl: './tracking.page.html',
    styleUrls: ['./tracking.page.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, NgOptimizedImage],
})
export class TrackingPage implements OnInit, OnDestroy {
    subscription: Subscription;

    dishes: Dish[];
    loaded = false;
    logged: boolean;
    registerUrl = env.accountUrl + "/register";

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


        const result: { dishes: Dish[]; logged: boolean; } = await this.service.get({}, "tracking");


        if(result) {
            this.logged = result.logged;
            this.dishes = [];

            for(let dish of result.dishes) {
                dish.imageUrl = `${env.apiUrl}/customer/${this.service.restaurant._id}/dishes/${dish.dishId}/image`;
            }

            
            this.dishes = result.dishes;
        } else {
            this.ngOnDestroy();
            setTimeout(() => {
                this.ngOnInit();
            }, 1000);
        }

        this.loaded = true;
    }
    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}
