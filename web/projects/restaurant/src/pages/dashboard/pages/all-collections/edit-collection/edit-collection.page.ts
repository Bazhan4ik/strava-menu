import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { BooleanLiteral } from 'typescript';


interface Collection {
    name: string;
    description: string;
    image: string;
    id: string;
}
interface Dish {
    name: string;
    image: string;
    id: string;
    _id: string;
}


@Component({
  selector: 'app-edit-collection',
  templateUrl: './edit-collection.page.html',
  styleUrls: ['./edit-collection.page.scss']
})
export class EditCollectionPage implements OnInit {
    collection: Collection;
    dishes: Dish[] = [];

    image: string = "./../../../../../../../../global-resources/images/no-image.svg";
    name: string;
    description: string;

    imageUpdated: boolean = false;


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private service: RestaurantService,
    ) {};


    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    removeDish(id: string) {
        for(let i in this.dishes) {
            if(this.dishes[i].id == id) {
                this.dishes.splice(+i, 1);
                break;
            }
        }
    }

    async addDishes() {
        const { SelectDishesModal } = await import("./../shared-components/select-dishes/select-dishes.modal");

        const component = this.modalContainer.createComponent(SelectDishesModal);

        component.instance.selected = this.dishes;

        
        component.instance.leave.subscribe((dishes: Dish[]) => {
            if(dishes) {
                this.dishes = dishes;
            }
            component.destroy();
        });
    }

    async setImage() {
        const { ImageModal } = await import("./../shared-components/image/image.modal");

     
        const component = this.modalContainer.createComponent(ImageModal);


        component.instance.leave.subscribe((image: string) => {
            if(image) {
                this.image = image;
                this.imageUpdated = true;
            }
            component.destroy();
        });
    }


    async save() {
        if(!this.name || this.name.length == 0) {
            return;
        }

        const update = {
            dishes: this.dishes,
            name: this.name,
            description: this.description,
            image: this.imageUpdated ? this.image : null!,
        };


        console.log(update);

        const result: { updated: boolean; id: string; } = await this.service.put(update, "menu/collections", this.collection.id);

        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "menu", "collections", result.id]);
        }

    }



    async ngOnInit() {
        const collectionId = this.route.snapshot.paramMap.get("collectionId");

        if(!collectionId) {
            return this.router.navigate([this.service.restaurant.id, "menu", "collections"]);
        }


        const result: {
            collection: Collection;
            dishes: Dish[];
        } = await this.service.get("menu/collections", collectionId);

        console.log(result);
        
        for(let dish of result.dishes) {
            this.dishes.push({
                name: dish.name,
                id: dish.id,
                _id: dish._id,
                image: getImage(dish.image),
            });
        }

        if(result.collection.image) {
            this.image = getImage(result.collection.image);
        }

        this.name = result.collection.name;
        this.description = result.collection.description;

        this.collection = result.collection;

        return;
    }
}
