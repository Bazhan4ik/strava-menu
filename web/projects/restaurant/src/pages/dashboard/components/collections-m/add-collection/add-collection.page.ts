import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';


interface Dish {
    name: string;
    id: string;
    image: string;
    _id: string;
}




@Component({
    selector: 'app-add-collection',
    templateUrl: './add-collection.page.html',
    styleUrls: ['./add-collection.page.scss']
})
export class AddCollectionPage implements OnInit {
    name: string;
    description: string;

    image = "./../../../../../../../../global-resources/images/no-image.svg";
    imageUpdated: boolean = false;

    dishes: Dish[] = [];

    constructor(
        private service: RestaurantService,
        private router: Router,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


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


    async save() {
        console.log(this.dishes, this.name, this.description, this.image);

        if(!this.name || this.name.length < 1) {
            return;
        }

        const result: any = await this.service.post({
            name: this.name,
            description: this.description,
            dishes: this.dishes,
            image: this.imageUpdated ? this.image : null,
        }, "menu/collections");

        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "menu", "collections"]);
        }
    }

    ngOnInit() {
        
    }
}
