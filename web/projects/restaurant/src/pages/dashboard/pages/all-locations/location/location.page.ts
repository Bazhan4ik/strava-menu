import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';




interface Location {
    name: string;
    id: string;
    // _id: string;

    settings: {
        customers: {
            maxDishes: number;
            allowOrderingOnline: boolean;
            allowDineIn: boolean;
            allowTakeOut: boolean;
        };
        methods: {
            card: boolean;
            cash: boolean;
        }
    }

    latlng: [number, number];

    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
}





@Component({
    selector: 'app-location',
    templateUrl: './location.page.html',
    styleUrls: ['./location.page.scss']
})
export class LocationPage implements OnInit {
    location: Location;


    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
        private router: Router,
    ) { };


    async onMethodChange(ev: any, t: "cash" | "card") {
        const val = ev.target.checked;

        const update: any = await this.service.put({ type: t, value: val }, "locations", this.location.id, "methods");

        if(!update.updated) {
            ev.target.checked = !val;
        }
    }

    async onCustomersChange(ev: any, t: string) {
        const val = ev.target.checked;

        const update: any = await this.service.put({ type: t, value: val }, "locations", this.location.id, "customers");

        if(!update.updated) {
            ev.target.checked = !val;
        }
    }

    async remove() {
        const result: any = await this.service.delete("locations", this.location.id);

        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "locations"]);
        }
    }


    async ngOnInit() {
        const locationId = this.route.snapshot.paramMap.get("locationId");

        const result: any = await this.service.get("locations", locationId!);

        this.location = result;

        console.log(result);
    }
}
