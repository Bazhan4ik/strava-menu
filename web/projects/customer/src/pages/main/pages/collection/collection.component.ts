import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishesService } from 'projects/customer/src/services/dishes.service';
import { DishComponent } from '../../components/dish/dish.component';
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
    dishes: string[]

    constructor(
        private service: CustomerService,
        private router: Router,
        private dishesService: DishesService,
        private route: ActivatedRoute,
    ) { };



    async ngOnInit() {
        
        const collectionId = this.route.snapshot.paramMap.get("collectionId");

        if(!collectionId) {
            return;
        }

        const result: any = await this.service.get({}, "collections", collectionId);

        console.log(result.dishes);

        this.collection = result.collection;
        this.dishesService.dishes = { ...this.dishesService.dishes, ...result.dishes };

        console.log(this.dishesService.dishes);
    }
}
