import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

interface Ingredient {
    title: string;
    id: string;
}

@Component({
    selector: 'app-add-item',
    templateUrl: './add-item.page.html',
    styleUrls: ['./add-item.page.scss']
})
export class AddItemPage implements OnInit {
    constructor(
        private service: RestaurantService,
        private router: Router,
    ) { };

    autocomplete: { display: string; value: string }[];
    timeout: any;
    form: FormGroup;
    imageChanged = false;
    loading = false;

    image: string = "./../../../../../../../dashboard/global-resources/images/no-image.svg"; 
    // add dashboard to get the image. this app is served on /dashboard route and without the dashboard added in this path angular will try to get the image from 
    // "https://restaurant.example.com/", should from "https://restaurant.example.com/dashboard". There should be a better solution


    
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;



    async ngOnInit() {
        this.form = new FormGroup({
            name: new FormControl(null, Validators.required),
            price: new FormControl(null, Validators.required),
            description: new FormControl(null),
            tags: new FormControl(null),
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
            image: this.imageChanged ? {
                base64: this.image,
                resolution: 1
            } : undefined,
        }, "menu/items");
        
        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "menu"]);
            return;
        }
        this.loading = false;
    }
    removeImage() {
        this.image = "./../../../../../../../dashboard/global-resources/images/no-image.svg";
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
                this.imageChanged = true;
                this.image = image;
            }
            component.destroy();
        });

    }
}
