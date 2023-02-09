import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishComponent } from '../../components/dish/dish.component';
import { MiniTrackingComponent } from '../../components/mini-tracking/mini-tracking.component';
import { Collection } from '../../models/collection';

@Component({
    selector: 'app-recommendations',
    templateUrl: './recommendations.page.html',
    styleUrls: ['./recommendations.page.scss'],
    standalone: true,
    imports: [CommonModule, DishComponent, MatIconModule, MiniTrackingComponent],
})
export class RecommendationsPage implements OnInit {
    collections: Collection[];
    tracking: any;

    constructor(
        private service: CustomerService,
    ) {}


    async ngOnInit() {
        const result: { collections: Collection[]; tracking: any[] } = await this.service.get({}, "recommendations");

        console.log(result);

        this.collections = result.collections;
        this.tracking = result.tracking;
    }
}
