import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';

@Component({
    selector: 'app-item-waiter',
    templateUrl: './item-waiter.component.html',
    styleUrls: ['./item-waiter.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class ItemWaiterComponent implements OnInit {

    image: string;

    @Input() sessionItem: ConvertedSessionItem;


    ngOnInit() {
        this.image = getImage(this.sessionItem.item.image) || "./../../../../../../../global-resources/images/no-image.svg";
    }
}
