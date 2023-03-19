import { Injectable } from '@angular/core';
import { Item } from '../pages/main/models/item';
import { CustomerService } from './customer.service';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    items: { [ objectId: string ]: Item };

    constructor(
        private service: CustomerService,
    ) { };

}
