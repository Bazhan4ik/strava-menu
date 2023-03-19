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
    loading = false;

    image = "./../../../../../../../../global-resources/images/no-image.svg";
    imageUpdated: boolean = false;

    items: Dish[] = [];

    constructor(
        private service: RestaurantService,
        private router: Router,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async setImage() {
        const { ImageModal } = await import("../../../components/image/image.modal");

     
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
        for(let i in this.items) {
            if(this.items[i].id == id) {
                this.items.splice(+i, 1);
                break;
            }
        }
    }

    async addDishes() {
        const { SelectItemsModal } = await import("../../../components/select-items/select-items.modal");

        const component = this.modalContainer.createComponent(SelectItemsModal);

        component.instance.selected = this.items;

        
        component.instance.leave.subscribe((items: Dish[]) => {
            if(items) {
                this.items = items;
            }
            component.destroy();
        });
    }


    async save() {
        if(!this.name || this.name.length < 1) {
            return;
        }
        this.loading = true;

        const result: any = await this.service.post({
            name: this.name,
            description: this.description,
            items: this.items,
            image: this.imageUpdated ? this.image : null,
        }, "menu/collections");

        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "menu", "collections"]);
        }
        this.loading = false;
    }

    ngOnInit() {
        
    }
}
