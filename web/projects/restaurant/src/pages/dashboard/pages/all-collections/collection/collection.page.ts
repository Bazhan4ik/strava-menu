import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface CollectionInfo {
    name: string;
    description: string;
    image: any;
    id: string;
}

interface Dish {
    name: string;
    id: string;
    image: any;
}

@Component({
    selector: 'app-collection',
    templateUrl: './collection.page.html',
    styleUrls: ['./collection.page.scss']
})
export class CollectionPage implements OnInit {

    collection: CollectionInfo;
    dishes: Dish[];

    image = "./../../../../../../../../global-resources/images/no-image.svg";

    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
        private router: Router,
    ) { };




    async ngOnInit() {

        const collectionId = this.route.snapshot.paramMap.get("collectionId");

        if(!collectionId) {
            return this.router.navigate(["dashboard", this.service.restaurant.id, "menu", "collections"]);
        }

        const result:{
            collection: CollectionInfo;
            dishes: Dish[];
        } = await this.service.get("menu/collections", collectionId);

        this.collection = result.collection;
        this.dishes = result.dishes;

        if(this.collection.image) {
            this.image = getImage(this.collection.image);
        }

        for(let dish of this.dishes) {
            dish.image = getImage(dish.image) || "./../../../../../../../../global-resources/images/no-image.svg";
        }

        console.log(result);

        return;
    }

}
