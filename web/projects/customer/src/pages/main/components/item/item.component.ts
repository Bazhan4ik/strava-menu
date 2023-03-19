import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
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

    image: string = "./../../../../../../../dashboard/global-resources/images/no-image.svg"; // FIX THE DASHBOARD THING

    item: Item;

    url: string;
    backUrl: string;
    imageUrl: string;

    
    constructor(
        private itemsService: ItemsService,
        private service: CustomerService,
        private router: Router,
    ) {}


    @Input() itemObjectId: string;
    @Input() collection: string;
    @Input() small: boolean;

    imageLoaded() {
        console.log("IMAGE LAODED");
    }

    async ngOnInit() {

        this.item = this.itemsService.items[this.itemObjectId];
        this.url = `/${this.service.restaurant.id}/${this.service.locationId}/item/${this.item.id}`;
        this.backUrl = this.router.url;
        this.imageUrl = env.apiUrl + "/customer/" + this.service.restaurant._id + "/items/" + this.item._id + "/image";
    }

}
