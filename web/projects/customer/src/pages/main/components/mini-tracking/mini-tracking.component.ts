import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { DishesEvent } from '../../models/socket';


interface Dish {
    name: string;
    status: string;
    image: any;
    _id: string;
}


@Component({
    selector: 'app-mini-tracking',
    templateUrl: './mini-tracking.component.html',
    styleUrls: ['./mini-tracking.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule]
})
export class MiniTrackingComponent implements OnInit, OnDestroy {

    constructor(
        private service: CustomerService,
    ) { };


    @Input() dishes: Dish[];


    ngOnInit() {

        this.service.$dishes.subscribe(data => {
            console.log(data);
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
            dish.image = getImage(dish.image) || "./../../../../../../../global-resources/images/no-image.svg";
        }
    }
    ngOnDestroy() {
        
    }

}
