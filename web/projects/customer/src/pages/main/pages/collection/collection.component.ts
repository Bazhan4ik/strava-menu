import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { ItemsService } from 'projects/customer/src/services/items.service';
import { DishComponent } from '../../components/item/item.component';
import { Collection } from '../../models/collection';

@Component({
    selector: 'app-collection',
    templateUrl: './collection.component.html',
    styleUrls: ['./collection.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, DishComponent],
})
export class CollectionComponent implements OnInit {

    collection: Collection;
    items: string[]

    constructor(
        private service: CustomerService,
        private router: Router,
        private itemsService: ItemsService,
        private route: ActivatedRoute,
    ) { };



    async ngOnInit() {
        
        const collectionId = this.route.snapshot.paramMap.get("collectionId");

        if(!collectionId) {
            return;
        }

        let result: any;

        try {
            result = await this.service.get({}, "collections", collectionId);
        } catch (e: any) {
            if(e.status == 403) {
                this.router.navigate([this.service.restaurant.id, this.service.locationId, "home"]);
                return;
            }
        }

        console.log(result.items);

        this.collection = result.collection;
        this.itemsService.items = { ...this.itemsService.items, ...result.items };

        console.log(this.itemsService.items);
    }
}
