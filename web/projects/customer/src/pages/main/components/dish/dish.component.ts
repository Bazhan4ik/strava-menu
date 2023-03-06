import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishesService } from 'projects/customer/src/services/dishes.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';
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
    imageUrl: string;

    
    constructor(
        private dishesService: DishesService,
        private service: CustomerService,
    ) {}


    @Input() dishObjectId: string;
    @Input() collection: string;
    @Input() small: boolean;

    imageLoaded() {
        console.log("IMAGE LAODED");
    }

    async ngOnInit() {

        this.dish = this.dishesService.dishes[this.dishObjectId];
        
        this.url = `/${this.service.restaurant.id}/${this.service.locationId}/${this.dish.id}`;
        this.imageUrl = env.apiUrl + "/customer/" + this.service.restaurant._id + "/dishes/" + this.dish._id + "/image";
        
        // if(this.dish.library.list) {
        //     this.image = getImage(this.dish.library.list[0].buffer);
        //     return;
        // }


        // this.image =  getImage(this.dish.library.blur) || "./../../../../../../../dashboard/global-resources/images/no-image.svg";;
    }

}
