import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishesService } from 'projects/customer/src/services/dishes.service';
import { Dish } from '../../models/dish';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage]
})
export class DishComponent implements OnInit {

    image: string = "./../../../../../../../dashboard/global-resources/images/no-image.svg"; // FIX THE DASHBOARD THING

    dish: Dish;

    url: string;
    backUrl: string;
    imageUrl: string;

    
    constructor(
        private dishesService: DishesService,
        private service: CustomerService,
        private router: Router,
    ) {}


    @Input() dishObjectId: string;
    @Input() collection: string;
    @Input() small: boolean;

    imageLoaded() {
        console.log("IMAGE LAODED");
    }

    async ngOnInit() {

        this.dish = this.dishesService.dishes[this.dishObjectId];
        this.url = `/${this.service.restaurant.id}/${this.service.locationId}/dish/${this.dish.id}`;
        this.backUrl = this.router.url;
        this.imageUrl = env.apiUrl + "/customer/" + this.service.restaurant._id + "/dishes/" + this.dish._id + "/image";
    }

}
