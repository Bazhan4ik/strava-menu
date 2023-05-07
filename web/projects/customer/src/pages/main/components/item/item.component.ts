import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { ItemsService } from 'projects/customer/src/services/items.service';
import { Item } from '../../models/item';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage]
})
export class DishComponent implements OnInit {
    constructor(
        private itemsService: ItemsService,
        private service: CustomerService,
        private router: Router,
    ) {};

    item: Item;
    image: string = "./../../../../../../../dashboard/global-resources/images/no-image.svg"; // FIX THE DASHBOARD THING
    url: string;
    backUrl: string;
    imageUrl: string;

    modal = false;

    @Input() itemObjectId: string;
    @Input() collection: string;
    @Input() small: boolean;

    @ViewChild("itemModalContainer", { read: ViewContainerRef }) itemModalContainer: ViewContainerRef;


    async ngOnInit() {
        this.modal = window.innerWidth > 1200;
        this.item = this.itemsService.items[this.itemObjectId];
        this.url = `/${this.service.restaurant.id}/${this.service.locationId}/item/${this.item.id}`;
        this.backUrl = this.router.url;

        if(this.item.hasImage) {
            this.imageUrl = `${env.apiUrl}/customer/${this.service.restaurant._id}/items/${this.item._id}/image`;
        } else {
            this.imageUrl = "./../../../../../../../global-resources/images/no-image.svg"
        }
    }



    async openDishModal() {
        if(!this.modal) {
            return;
        }

        const { FullItemPage } = await import("./../../pages/full-item/full-item.page");

        const component = this.itemModalContainer.createComponent(FullItemPage);

        component.instance.modal = true;
        component.instance.itemId = this.item.id;
        component.instance.modalControl.subscribe(() => {
            component.destroy();
        });
    }
    imageLoaded() {
        console.log("IMAGE LAODED");
    }
}
