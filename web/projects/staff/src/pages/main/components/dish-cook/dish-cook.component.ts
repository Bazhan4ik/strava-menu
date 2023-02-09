import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionDish } from 'projects/staff/src/models/order-dishes';

@Component({
  selector: 'app-dish-cook',
  templateUrl: './dish-cook.component.html',
  styleUrls: ['./dish-cook.component.scss']
})
export class DishCookComponent implements OnInit, OnDestroy {

    image: string = "./../../../../../../../global-resources/images/no-image.svg";

    @Input() sessionDish: ConvertedSessionDish;

    createTakenInterval() {
        this.sessionDish.takenInterval = setInterval(() => {
            this.sessionDish.time.taken!.minutes++;
            if(this.sessionDish.time.taken!.minutes == 60) {
                this.sessionDish.time.taken!.hours++;
                this.sessionDish.time.taken!.minutes = 0;
            }
        }, 60000);
    }
    createOrderedInterval() {
        this.sessionDish.orderedInterval = setInterval(() => {
            this.sessionDish.time.ordered.minutes++;
            if(this.sessionDish.time.ordered.minutes == 60) {
                this.sessionDish.time.ordered.hours++;
                this.sessionDish.time.ordered.minutes = 0;
            }
        }, 60000);
    }

    ngOnInit() {
        this.image = getImage(this.sessionDish.dish.image);

        if(this.sessionDish.time.ordered) {
            this.sessionDish.orderedTimeout = setTimeout(() => {
                this.sessionDish.time.ordered.minutes++;
                if(this.sessionDish.time.ordered.minutes == 60) {
                    this.sessionDish.time.ordered.hours++;
                    this.sessionDish.time.ordered.minutes = 0;
                }
                this.createOrderedInterval();
            }, this.sessionDish.time.ordered.nextMinute);
            this.sessionDish.time.ordered.nextMinute = null!;
        }
        if(this.sessionDish.time.taken) {
            this.sessionDish.takenTimeout = setTimeout(() => {
                this.sessionDish.time.taken!.minutes++;
                if(this.sessionDish.time.taken!.minutes == 60) {
                    this.sessionDish.time.taken!.hours++;
                    this.sessionDish.time.taken!.minutes = 0;
                }
                this.createTakenInterval();
            }, this.sessionDish.time.taken.nextMinute);
            this.sessionDish.time.taken!.nextMinute = null!;
        }
    }

    ngOnDestroy() {
        clearInterval(this.sessionDish.takenInterval);
        clearInterval(this.sessionDish.orderedInterval);
        this.sessionDish.takenInterval = null;
        this.sessionDish.orderedInterval = null;
    }
}
