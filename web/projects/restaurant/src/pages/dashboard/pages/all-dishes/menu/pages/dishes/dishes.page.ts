import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';



interface Dish {
    name: string;
    id: string;
    price: number;
    image: any;
    imageConverted: string;
    status: string;
}



@Component({
    selector: 'app-dishes',
    templateUrl: './dishes.page.html',
    styleUrls: ['./dishes.page.scss']
})
export class DishesPage implements OnInit {
    dishes: Dish[];

    constructor(
        private service: RestaurantService,
        private router: Router,
    ) {};


    async onVisibilityChange(event: Event, dishId: string) {
        const input = (event.target as HTMLInputElement);
        const value = input.checked;


        const update: any = await this.service.put({ value }, "menu/dishes", dishId, "visibility");
        
        if(!update.updated) {
            (event.target as HTMLInputElement).checked = !value;
        }

    }

    async ngOnInit() {
        const result: Dish[] = await this.service.get("menu/dishes");

        this.dishes = result;

        for(let dish of this.dishes) {
            dish.imageConverted = getImage(dish.image) || "./../../../../../../../../../../global-resources/images/no-image.svg";
        }

        console.log(result);
    }
}
