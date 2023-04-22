import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';

@Component({
    selector: 'app-item-waiter',
    templateUrl: './item-waiter.component.html',
    styleUrls: ['./item-waiter.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class ItemWaiterComponent implements OnInit {

    image: string;

    @Input() sessionItem: ConvertedSessionItem;
    @Input() showOrderInfo = true;


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
