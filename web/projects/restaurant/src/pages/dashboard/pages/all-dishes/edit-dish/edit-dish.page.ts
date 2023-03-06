import { Component, OnInit, ViewChild, ViewContainerRef, } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Ingredient {
    title: string;
    id: string;
}

interface Dish {
    name: string;
    price: number;
    description: string;
    _id: string;
    id: string;
    tags: { id: string; title: string; }[];
    ingredients: { amount: number; id: string; title: string; }[];

    image: any;
}


@Component({
  selector: 'app-edit-dish',
  templateUrl: './edit-dish.page.html',
  styleUrls: ['./edit-dish.page.scss']
})
export class EditDishPage implements OnInit {

    ingredientsFound: Ingredient[];
    ingredientsSearchText: string;
    ingredients: { title: string; id: string; amount: number; }[];

    autocomplete: { display: string; id: string; }[];

    image: string;
    imageChanged: boolean;

    form: FormGroup;

    timeout: any;

    disable = false;
    
    dish: Dish;


    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
        private router: Router,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    removeIngredient(id: string) {
        for(let i in this.ingredients) {
            if(this.ingredients[i].id == id) {
                this.ingredients.slice(+i, 1);
                break;
            }
        }
    }
    async searchIngredients() {
        const result: any = await this.service.ingredients(this.ingredientsSearchText);

        this.ingredientsFound = result;
    }
    async addIngredient(ingredient: Ingredient) {
        const { AddIngredientModal } = await import("../../../components/add-ingredient/add-ingredient.modal");


        const component = this.modalContainer.createComponent(AddIngredientModal);

        component.instance.ingredient = ingredient;

        component.instance.leave.subscribe((amount: number) => {
            if(amount) {
                this.ingredients.push({
                    id: ingredient.id,
                    amount: amount,
                    title: ingredient.title,
                });
            }
            component.destroy();
        });

    }

    onInput(ev: any) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(async () => {
            this.autocomplete = await this.service.tags(ev.target.value);
        }, 500);
    }

    async setImage() {
        const { ImageModal } = await import("./../../../components/image/image.modal");

        const component = this.modalContainer.createComponent(ImageModal);

        component.instance.leave.subscribe((image: string) => {
            if(image) {
                this.image = image;
                this.imageChanged = true;
            }
            component.destroy();
        });

    }

    async save() {
        if(!this.form.valid || this.form.value.price < 1) {
            return;
        }

        this.disable = true;

        const body = {
            ...this.form.value,
            price: this.form.value.price * 100,
            ingredients: this.ingredients,
        };

        if(this.imageChanged) {
            body.image = {
                base64: this.image,
                resolution: 1,
            };
        }



        const result: any = await this.service.put(body, "menu/dishes", this.dish.id);

        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "menu", "dishes", result.newId]);
        }

    }

    async remove() {
        this.disable = true;

        const result: any = await this.service.delete("menu/dishes", this.dish._id);

        if(result.updated) {
            return this.router.navigate([this.service.restaurant.id, "menu", "dishes"]);
        }

        this.disable = false;

        return;
    }


    async ngOnInit() {
        const dishId = this.route.snapshot.paramMap.get("dishId");

        if(!dishId) {
            return this.router.navigate([this.service.restaurant.id, "menu"]);
        }

        const dish: Dish = await this.service.get("menu/dishes", dishId, "edit");

        if(!dish) {
            return this.router.navigate([this.service.restaurant.id, "menu"]);
        }

        this.dish = dish;

        if(dish.image) {
            this.image = getImage(dish.image);
        }

        this.ingredients = dish.ingredients;

        this.form = new FormGroup({
            name: new FormControl(dish.name, Validators.required),
            price: new FormControl(dish.price / 100, Validators.required),
            description: new FormControl(dish.description, Validators.required),
            tags: new FormControl(dish.tags),
        });

        return;
    }

}
