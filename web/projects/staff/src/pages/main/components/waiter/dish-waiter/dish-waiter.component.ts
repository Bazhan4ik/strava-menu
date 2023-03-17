import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionDish } from 'projects/staff/src/models/order-dishes';

@Component({
    selector: 'app-dish-waiter',
    templateUrl: './dish-waiter.component.html',
    styleUrls: ['./dish-waiter.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class DishWaiterComponent implements OnInit {

    image: string;

    @Input() sessionDish: ConvertedSessionDish;


    ngOnInit() {
        this.image = getImage(this.sessionDish.dish.image) || "./../../../../../../../global-resources/images/no-image.svg";
    }
}
