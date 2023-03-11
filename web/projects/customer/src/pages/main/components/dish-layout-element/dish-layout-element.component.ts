import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Dish } from '../../models/dish';

@Component({
    selector: 'app-dish-layout-element',
    templateUrl: './dish-layout-element.component.html',
    styleUrls: ['./dish-layout-element.component.scss'],
    standalone: true,
    imports: [CommonModule, NgOptimizedImage, RouterModule],
})
export class DishLayoutElementComponent implements OnInit {

    imageUrl: string;

    constructor(
        private service: CustomerService,
    ) { };

    @Input() dish: Dish;


    async ngOnInit() {
        this.imageUrl = `${env.apiUrl}/customer/${this.service.restaurant._id}/dishes/${this.dish._id}/image`;
    }
}
