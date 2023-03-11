import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

interface Location {
    name: string;
    _id: string;
    city: string;
    line1: string;
    id: string;
}


@Component({
    selector: 'app-select-live-location',
    templateUrl: './select-live-location.page.html',
    styleUrls: ['./select-live-location.page.scss']
})
export class SelectLiveLocationPage implements OnInit {

    locations: Location[];

    constructor(
        private service: RestaurantService,
    ) { };



    async ngOnInit() {
        const result: Location[] = await this.service.get("locations");

        this.locations = result || [];
        console.log(result);
    }

}
