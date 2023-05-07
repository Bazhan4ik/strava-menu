import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { env } from 'environment/environment';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';



interface Item {
    name: string;
    id: string;
    price: number;
    status: string;
    imageUrl: string;
    hasImage: boolean;
}



@Component({
    selector: 'app-items',
    templateUrl: './items.page.html',
    styleUrls: ['./items.page.scss']
})
export class ItemsPage implements OnInit {
    items: Item[];

    constructor(
        private service: RestaurantService,
        private router: Router,
    ) {};


    async onVisibilityChange(event: Event, itemId: string) {
        const input = (event.target as HTMLInputElement);
        const value = input.checked;


        const update: any = await this.service.put({ value }, "menu/items", itemId, "visibility");
        
        if(!update.updated) {
            (event.target as HTMLInputElement).checked = !value;
        }

    }

    async ngOnInit() {
        const result: { items: Item[], restaurantId: string; } = await this.service.get("menu/items");

        this.items = result.items;

        for(let item of this.items) {
            if(item.hasImage) {
                item.imageUrl = `${env.apiUrl}/restaurants/${result.restaurantId}/menu/items/${item.id}/image`;
            } else {
                item.imageUrl = "./../../../../../../../../../global-resources/images/no-image.svg";
            }
        }

        console.log(result);
    }
}
