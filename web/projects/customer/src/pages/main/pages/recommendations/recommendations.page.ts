import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishesService } from 'projects/customer/src/services/dishes.service';
import { CollectionComponent } from '../../components/collection/collection.component';
import { MiniTrackingComponent } from '../../components/mini-tracking/mini-tracking.component';
import { Collection } from '../../models/collection';
import { Dish } from '../../models/dish';

@Component({
    selector: 'app-recommendations',
    templateUrl: './recommendations.page.html',
    styleUrls: ['./recommendations.page.scss'],
    standalone: true,
    imports: [CommonModule, CollectionComponent, MatIconModule, MiniTrackingComponent],
})
export class RecommendationsPage implements OnInit {
    collections: Collection[];
    tracking: any;

    position: number;

    constructor(
        private service: CustomerService,
        private dishesService: DishesService,
    ) {
    }


    async ngOnInit() {
        const result: { collections: Collection[]; dishes: { [dishObjectId: string]: Dish }; tracking: any[] } = await this.service.get({ }, "recommendations");

        console.log(result);

        this.dishesService.dishes = result.dishes;

        this.collections = result.collections;
        this.tracking = result.tracking;
    }
}
