import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';


interface Location {
    name: string;
    id: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
}


@Component({
    selector: 'app-location',
    templateUrl: './location.page.html',
    styleUrls: ['./location.page.scss']
})
export class LocationPage implements OnInit {

    locations: Location[];
    restaurant: any;

    constructor(
        private service: CustomerService,
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    async ngOnInit() {
        const restaurantId = this.route.snapshot.paramMap.get("restaurantId");

        const result: { locations: Location[]; restaurant: any } = await this.service.getLocations(restaurantId!);


        if(result.locations.length == 1) {
            this.router.navigate([result.restaurant.id, result.locations[0].id]);
        }

        this.locations = result.locations;
        this.restaurant = result.restaurant;

        console.log(result);
    }
}
