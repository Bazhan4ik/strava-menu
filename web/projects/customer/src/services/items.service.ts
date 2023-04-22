import { Injectable } from '@angular/core';
import { Item } from '../pages/main/models/item';
import { CustomerService } from './customer.service';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    items: { [ objectId: string ]: Item };

    $previewUpdate = new Subject<boolean>();
    $checkoutUpdate = new Subject<boolean>();

    constructor(
        private service: CustomerService,
    ) { };

}
