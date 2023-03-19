import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';



interface Item {
    name: string;
    id: string;
    price: number;
    image: any;
    imageConverted: string;
    status: string;
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
        const result: Item[] = await this.service.get("menu/items");

        this.items = result;

        for(let item of this.items) {
            item.imageConverted = getImage(item.image) || "./../../../../../../../../../../global-resources/images/no-image.svg";
        }

        console.log(result);
    }
}
