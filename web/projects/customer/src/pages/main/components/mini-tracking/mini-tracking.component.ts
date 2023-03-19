import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Subscription } from 'rxjs';
import { ItemsEvent } from '../../models/socket';


interface Item {
    name: string;
    status: string;
    imageUrl: any;
    _id: string;
    itemId: string;
}


@Component({
    selector: 'app-mini-tracking',
    templateUrl: './mini-tracking.component.html',
    styleUrls: ['./mini-tracking.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, NgOptimizedImage]
})
export class MiniTrackingComponent implements OnInit, OnDestroy {

    subscription: Subscription;

    constructor(
        private service: CustomerService,
    ) { };


    @Input() items: Item[];


    ngOnInit() {


        this.subscription = this.service.$items.subscribe(data => {
            if(data.types.includes("items/status")) {
                for(let item of this.items) {
                    const { sessionItemId, status } = data.data as ItemsEvent.status;
                    if(item._id == sessionItemId) {
                        item.status = status;
                        break;
                    }
                }
            }
        });

        for(let item of this.items) {
            item.imageUrl = env.apiUrl + "/customer/" + this.service.restaurant._id + "/items/" + item.itemId + "/image";
        }
    }
    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

}
