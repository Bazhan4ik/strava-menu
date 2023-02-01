import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishComponent } from '../../components/dish/dish.component';
import { Collection } from '../../models/collection';

@Component({
    selector: 'app-recommendations',
    templateUrl: './recommendations.page.html',
    styleUrls: ['./recommendations.page.scss'],
    standalone: true,
    imports: [CommonModule, DishComponent, MatIconModule],
})
export class RecommendationsPage implements OnInit {
    collections: Collection[];

    constructor(
        private service: CustomerService,
    ) {}


    async ngOnInit() {
        const result: Collection[] = await this.service.get({}, "dishes");

        console.log(result);

        this.collections = result;
    }
}
