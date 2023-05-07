import { Component, OnInit } from '@angular/core';
import { env } from 'environment/environment';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Collection {
    name: string;
    id: string;
    image: any;
    hasImage: boolean;
}

interface Folder {
    name: string;
    id: string;
    image: any;
    open: boolean;
    collections: Collection[];
}

@Component({
    selector: 'app-collections',
    templateUrl: './collections.page.html',
    styleUrls: ['./collections.page.scss'],
})
export class CollectionsPage implements OnInit {


    dayTimes: Folder = { collections: [], id: "", name: "", open: false, image: "" };
    itemTypes: Folder = { collections: [], id: "", name: "", open: false, image: "" };
    collections: Collection[];



    constructor(
        private service: RestaurantService,
    ) { }



    async ngOnInit() {
        const result: Collection[] = await this.service.get("menu/collections");

        if (result) {
            this.collections = [];

            for (let c of result) {
                const collection = {
                    ...c,
                    image: c.hasImage ? `${env.apiUrl}/restaurants/${this.service.restaurant._id}/menu/collections/${c.id}/image` : "./../../../../../../../../../../global-resources/images/no-image.svg"
                };
                if ([
                    "appetizers",
                    "entrees",
                    "beverages",
                    "desserts",
                    "sides",
                    "soups",
                    "salads",
                ].includes(collection.id)) {
                    this.itemTypes.collections.push(collection);
                } else if ([
                    "breakfast",
                    "brunch",
                    "late-night",
                    "lunch",
                    "dinner",
                ].includes(collection.id)) {
                    this.dayTimes.collections.push(collection);
                } else {
                    this.collections.push(collection);
                }
            }
        }
    }
}
