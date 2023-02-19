import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

interface Ingredient {
    name: string;
    amount: number;
    price: number;
    id: string;
}


@Component({
    selector: 'app-ingredient',
    templateUrl: './ingredient.page.html',
    styleUrls: ['./ingredient.page.scss']
})
export class IngredientPage implements OnInit {

    ingredient: Ingredient;

    price: number;

    showSave = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private service: RestaurantService,
    ) { };

    onInput() {
        if(this.price > 0) {
            this.showSave = this.price != this.ingredient.price;
        }
    }

    async save() {
        this.showSave = false;

        const old = this.ingredient.price;

        this.ingredient.price = this.price * 100;


        const update: any = await this.service.put({ price: this.price }, "ingredients", this.ingredient.id, "price");

        if(!update.updated) {
            this.ingredient.price = old;
            this.price = old;
        }
    }

    async ngOnInit() {
        const ingredientId = this.route.snapshot.paramMap.get("ingredientId");

        if(!ingredientId) {
            return this.router.navigate([this.service.restaurant.id, "ingredients"]);
        }

        const result: any = await this.service.get("ingredients", ingredientId);

        
        this.ingredient = result;
        
        this.price = this.ingredient.price / 100;


        console.log(result);

        return;
    }
}
