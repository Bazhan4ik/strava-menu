import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Dish {
    name: string;
    price: number;
    description: number;
    id: string;
    _id: string;
    tags: { title: string; id: string; }[];
    library: {
        preview: any;
        list: {
            buffer: any;
            resolution: number;
        }[]
    }
}

@Component({
    selector: 'app-dish',
    templateUrl: './dish.page.html',
    styleUrls: ['./dish.page.scss']
})
export class DishPage implements OnInit {

    dish: Dish;

    image: string;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private service: RestaurantService,
    ) {}

    async ngOnInit() {
        const dishId = this.route.snapshot.paramMap.get("dishId");

        
        if(!dishId) {
            return this.router.navigate([this.service.restaurant.id, "menu/dishes"]);
        }
        
        
        const dish: Dish = await this.service.get("menu/dishes", dishId);
        
        this.service.currentDishId = dish.id;



        console.log(dish);

        
        if(dish.library && dish.library.preview) {
            this.image = getImage(dish.library.preview);
        }

        this.dish = dish;

        return;
    }
}
