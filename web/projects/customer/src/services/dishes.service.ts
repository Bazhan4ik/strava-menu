import { Injectable } from '@angular/core';
import { Dish } from '../pages/main/models/dish';
import { CustomerService } from './customer.service';

@Injectable({
    providedIn: 'root'
})
export class DishesService {

    dishes: { [ objectId: string ]: Dish };

    constructor(
        private service: CustomerService,
    ) { };

}
