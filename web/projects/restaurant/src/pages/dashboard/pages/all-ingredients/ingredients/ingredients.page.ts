import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';




interface Ingredient {
    name: string;
    id: string;
    amount: number;
    price: number;
}





@Component({
    selector: 'app-ingredients',
    templateUrl: './ingredients.page.html',
    styleUrls: ['./ingredients.page.scss']
})
export class IngredientsPage implements OnInit {

    ingredients: Ingredient[];

    constructor(
        private service: RestaurantService,
    ) { };


    async ngOnInit() {
        let result: {
            ingredients: Ingredient[];
        } = null!;

        try {
            result = await this.service.get("ingredients");
        } catch (e) {
            throw e;
        }

        this.ingredients = result.ingredients;

    }
}
