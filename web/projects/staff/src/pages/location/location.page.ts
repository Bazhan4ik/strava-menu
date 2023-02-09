import { Component, OnInit } from '@angular/core';
import { StaffService } from '../../services/staff.service';




interface Location {
    name: string;
    id: string;
    line1: string;
    line2: string;
    city: string;
}




@Component({
    selector: 'app-location',
    templateUrl: './location.page.html',
    styleUrls: ['./location.page.scss']
})
export class LocationPage implements OnInit {
    locations: Location[];
    restaurant: { name: string; };

    constructor(
        private service: StaffService,
    ) {}

    ngOnInit() {
        this.restaurant = this.service.restaurant;
        this.locations = this.service.locations;
    }
}
