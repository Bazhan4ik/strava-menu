import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishesEvent } from '../../models/socket';


interface Dish {
    name: string;
    status: string;
    imageUrl: any;
    _id: string;
    dishId: string;
}


@Component({
    selector: 'app-mini-tracking',
    templateUrl: './mini-tracking.component.html',
    styleUrls: ['./mini-tracking.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, NgOptimizedImage]
})
export class MiniTrackingComponent implements OnInit, OnDestroy {

    constructor(
        private service: CustomerService,
    ) { };


    @Input() dishes: Dish[];


    ngOnInit() {

        this.service.$dishes.subscribe(data => {
            if(data.types.includes("dishes/status")) {
                for(let dish of this.dishes) {
                    const { sessionDishId, status } = data.data as DishesEvent.status;
                    if(dish._id == sessionDishId) {
                        dish.status = status;
                        break;
                    }
                }
            }
        });

        for(let dish of this.dishes) {
            dish.imageUrl = env.apiUrl + "/customer/" + this.service.restaurant._id + "/dishes/" + dish.dishId + "/image";
        }
    }
    ngOnDestroy() {
        
    }

}
