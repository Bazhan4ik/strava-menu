import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

interface Location {
    country?: string;
    city?: string;
    state?: string;
    line1?: string;
    line2?: string;
    postalCode?: string;

    name: string;
    id: string;
}

@Component({
    selector: 'app-locations',
    templateUrl: './locations.page.html',
    styleUrls: ['./locations.page.scss']
})
export class LocationsPage implements OnInit {

    locations: Location[];


    constructor(
        private service: RestaurantService,
    ) {}
    


    async ngOnInit() {
        const result: any = await this.service.get("locations");

        this.locations = result;
    }
}
