import { Component, Input, OnInit } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionDish } from 'projects/staff/src/models/order-dishes';

@Component({
    selector: 'app-dish-waiter',
    templateUrl: './dish-waiter.component.html',
    styleUrls: ['./dish-waiter.component.scss']
})
export class DishWaiterComponent implements OnInit {

    image: string;

    @Input() sessionDish: ConvertedSessionDish;


    ngOnInit() {
        if(this.sessionDish.dish.image) {
            this.image = getImage(this.sessionDish.dish.image);
        }
    }
}
