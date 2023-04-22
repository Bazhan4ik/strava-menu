import { Component, OnInit, ViewChild, ViewContainerRef, } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Ingredient {
    title: string;
    id: string;
}

interface Item {
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
  selector: 'app-edit-item',
  templateUrl: './edit-item.page.html',
  styleUrls: ['./edit-item.page.scss']
})
export class EditItemPage implements OnInit {
    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
        private router: Router,
    ) {};


    ingredientsFound: Ingredient[];
    ingredientsSearchText: string;
    ingredients: { title: string; id: string; amount: number; }[];
    autocomplete: { display: string; id: string; }[];
    image: string;
    imageChanged: boolean;
    form: FormGroup;
    timeout: any;
    disable = false;
    item: Item;


    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async ngOnInit() {
        const itemId = this.route.snapshot.paramMap.get("itemId");

        if(!itemId) {
            return this.router.navigate([this.service.restaurant.id, "menu"]);
        }

        const item: Item = await this.service.get("menu/items", itemId, "edit");

        if(!item) {
            return this.router.navigate([this.service.restaurant.id, "menu"]);
        }

        this.item = item;

        if(item.image) {
            this.image = getImage(item.image);
        }

        this.ingredients = item.ingredients;

        this.form = new FormGroup({
            name: new FormControl(item.name, Validators.required),
            price: new FormControl(item.price / 100, Validators.required),
            description: new FormControl(item.description),
            tags: new FormControl(item.tags),
        });

        return;
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



        const result: any = await this.service.put(body, "menu/items", this.item._id);

        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "menu", "items", result.newId]);
        }

    }
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
        const { ImageModal } = await import("../../../components/image/image.modal");

        const component = this.modalContainer.createComponent(ImageModal);

        component.instance.leave.subscribe((image: string) => {
            if(image) {
                this.image = image;
                this.imageChanged = true;
            }
            component.destroy();
        });

    }
    async remove() {
        this.disable = true;

        const result: any = await this.service.delete("menu/items", this.item._id);

        if(result.updated) {
            return this.router.navigate([this.service.restaurant.id, "menu", "items"]);
        }

        this.disable = false;

        return;
    }
}
