import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Collection {
    name: string;
    id: string;
    image: any;
}

@Component({
  selector: 'app-collections',
  templateUrl: './collections.page.html',
  styleUrls: ['./collections.page.scss']
})
export class CollectionsPage implements OnInit {


    collections: Collection[];


    constructor(
        private service: RestaurantService,
    ) {}



    async ngOnInit() {
        const result: Collection[] = await this.service.get("menu/collections");

        if(result) {
            this.collections = [];
            for(let collection of result) {
                this.collections.push({
                    ...collection,
                    image: getImage(collection.image) || "./../../../../../../../../../../global-resources/images/no-image.svg",
                });
            }
        }


        console.log(result);
    }
}
