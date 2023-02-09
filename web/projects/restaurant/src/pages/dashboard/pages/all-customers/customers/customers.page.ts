import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';


interface Customer {
    name: string;
    avatar: string;
    orders: number;
    total: number;
    date: string;
    _id: string;
}


@Component({
    selector: 'app-customers',
    templateUrl: './customers.page.html',
    styleUrls: ['./customers.page.scss']
})
export class CustomersPage implements OnInit {
    customers: Customer[];


    constructor(
        private service: RestaurantService,
        private router: Router,
    ) { };



    async ngOnInit() {
        const result: Customer[] = await this.service.get("customers");

        if(!result) {
            this.router.navigate([this.service.restaurant.id, "home"]);
            return; // leave
        }
        
        for(let customer of result) {
            customer.avatar = getImage(customer.avatar) || "./../../../../../../../../global-resources/images/plain-avatar.jpg";
        }

        this.customers = result;

        
        console.log(result);
    }
}
