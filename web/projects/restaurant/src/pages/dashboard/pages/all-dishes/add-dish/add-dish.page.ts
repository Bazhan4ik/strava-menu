import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

interface Ingredient {
    title: string;
    id: string;
}

@Component({
    selector: 'app-add-dish',
    templateUrl: './add-dish.page.html',
    styleUrls: ['./add-dish.page.scss']
})
export class AddDishPage implements OnInit {


    autocomplete: { display: string; value: string }[];
    timeout: any;
    form: FormGroup;

    imageChanged = false;
    image: string = "./../../../../../../../dashboard/global-resources/images/no-image.svg"; 
    // add dashboard to get the image. this app is served on /dashboard route and without the dashboard added in this path angular will try to get the image from 
    // "https://restaurant.example.com/", should from "https://restaurant.example.com/dashboard". There should be a better solution

    ingredientsSearchText: string;
    ingredientsFound: Ingredient[] = [];
    ingredients: { id: string; title: string; amount: number; }[] = [];

    loading = false;

    constructor(
        private service: RestaurantService,
        private router: Router,
    ) { }

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    


    removeImage() {
        this.image = "./../../../../../../../dashboard/global-resources/images/no-image.svg";
    }

    onInput(ev: any) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(async () => {
            this.autocomplete = await this.service.tags(ev.target.value);
        }, 500);
    }

    onTagAdded() {
        this.autocomplete = [];
    }

    async searchIngredients() {
        const result: any = await this.service.ingredients(this.ingredientsSearchText);

        this.ingredientsFound = result;
    }


    async addIngredient(ingredient: Ingredient) {
        const { AddIngredientModal } = await import("../shared-components/add-ingredient/add-ingredient.modal");


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

    removeIngredient(id: string) {
        for(let i in this.ingredients) {
            if(this.ingredients[i].id == id) {
                this.ingredients.splice(+i, 1);
                break;
            }
        }
    }

    async setImage() {
        const { ImageModal } = await import("../shared-components/image/image.modal");

        const component = this.modalContainer.createComponent(ImageModal);

        component.instance.leave.subscribe((image: string) => {
            if(image) {
                this.imageChanged = true;
                this.image = image;
            }
            component.destroy();
        });

    }

    async save() {
        if(!this.form.valid || this.form.value.price < 1) {
            return;
        }

        this.loading = true;
        
        const result: any = await this.service.post({
            ...this.form.value,
            price: this.form.value.price * 100,
            ingredients: this.ingredients,
            image: this.imageChanged ? {
                base64: this.image,
                resolution: 1
            } : undefined,
        }, "menu/dishes");
        
        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "menu"]);
            return;
        }
        this.loading = false;
    }

    async ngOnInit() {
        this.form = new FormGroup({
            name: new FormControl(null, Validators.required),
            price: new FormControl(null, Validators.required),
            description: new FormControl(null),
            tags: new FormControl(null),
        });
    }
}
