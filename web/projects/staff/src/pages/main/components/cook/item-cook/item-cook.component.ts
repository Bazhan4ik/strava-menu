import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';

@Component({
    selector: 'app-item-cook',
    templateUrl: './item-cook.component.html',
    styleUrls: ['./item-cook.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class ItemCookComponent implements OnInit, OnDestroy {

    image: string = "./../../../../../../../global-resources/images/no-image.svg";

    cookingTime: Date;
    beReadyTime: Date;


    @Input() sessionItem: ConvertedSessionItem;


    

    ngOnInit() {
        this.image = getImage(this.sessionItem.item.image) || "./../../../../../../../global-resources/images/no-image.svg";
        
        if (this.sessionItem.time.ordered) {
            this.sessionItem.orderedTimeout = setTimeout(() => {
                this.sessionItem.time.ordered.minutes++;
                if (this.sessionItem.time.ordered.minutes == 60) {
                    this.sessionItem.time.ordered.hours++;
                    this.sessionItem.time.ordered.minutes = 0;
                }
                this.createOrderedInterval();
            }, this.sessionItem.time.ordered.nextMinute);
            this.sessionItem.time.ordered.nextMinute = null!;
        }
        if (this.sessionItem.time.taken) {
            this.sessionItem.takenTimeout = setTimeout(() => {
                this.sessionItem.time.taken!.minutes++;
                if (this.sessionItem.time.taken!.minutes == 60) {
                    this.sessionItem.time.taken!.hours++;
                    this.sessionItem.time.taken!.minutes = 0;
                }
                this.createTakenInterval();
            }, this.sessionItem.time.taken.nextMinute);
            this.sessionItem.time.taken!.nextMinute = null!;
        }
        if(this.sessionItem.time.averageCooking) {
            this.cookingTime = new Date(this.sessionItem.time.averageCooking);

            if(this.sessionItem.time.beReady) {
                this.beReadyTime = new Date(this.sessionItem.time.beReady!);
                
                // Calculate the time when average cooking time + current time is greater than when the food should be ready
                const currentTime = Date.now();
                const warningTime = this.sessionItem.time.beReady - this.sessionItem.time.averageCooking;
                if ((currentTime - 3 * 60000) > warningTime) {
                    this.sessionItem.warning = true;
                }
                if(currentTime > warningTime) {
                    this.sessionItem.danger = true;
                }
            }
        }
    }
    ngOnDestroy() {
        clearInterval(this.sessionItem.takenInterval);
        clearInterval(this.sessionItem.orderedInterval);
        this.sessionItem.takenInterval = null;
        this.sessionItem.orderedInterval = null;
    }


    createTakenInterval() {
        this.sessionItem.takenInterval = setInterval(() => {
            this.sessionItem.time.taken!.minutes++;
            if (this.sessionItem.time.taken!.minutes == 60) {
                this.sessionItem.time.taken!.hours++;
                this.sessionItem.time.taken!.minutes = 0;
            }
            if(this.sessionItem.time.beReady && this.sessionItem.time.averageCooking) {
                const currentTime = Date.now();
                const warningTime = this.sessionItem.time.beReady - this.sessionItem.time.averageCooking;
                if ((currentTime + 3 * 60000) > warningTime) {
                    this.sessionItem.warning = true;
                }
                if(currentTime > warningTime) {
                    this.sessionItem.danger = true;
                }
            }
        }, 60000);
    }
    createOrderedInterval() {
        this.sessionItem.orderedInterval = setInterval(() => {
            this.sessionItem.time.ordered.minutes++;
            if (this.sessionItem.time.ordered.minutes == 60) {
                this.sessionItem.time.ordered.hours++;
                this.sessionItem.time.ordered.minutes = 0;
            }
        }, 60000);
    }
}
