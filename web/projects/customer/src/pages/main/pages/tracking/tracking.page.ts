import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Subscription } from 'rxjs';
import { ItemsEvent } from '../../models/socket';


interface Item {
    name: string;
    status: string;
    imageUrl: string;
    itemId: string;
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

    items: Item[];
    loaded = false;
    logged: boolean;
    registerUrl = env.accountUrl + "/register";

    constructor(
        private service: CustomerService,
    ) {}



    async ngOnInit() {
        this.subscription = this.service.$items.subscribe(data => {
            if(data.types.includes("items/status")) {
                const { sessionItemId, status } = data.data as ItemsEvent.status;
                for(let item of this.items) {
                    if(item._id == sessionItemId) {
                        item.status = status;
                        break;
                    }
                }
            }
        });


        const result: { items: Item[]; logged: boolean; } = await this.service.get({}, "tracking");


        if(result) {
            this.logged = result.logged;
            this.items = [];

            for(let item of result.items) {
                item.imageUrl = `${env.apiUrl}/customer/${this.service.restaurant._id}/items/${item.itemId}/image`;
            }

            
            this.items = result.items;
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
