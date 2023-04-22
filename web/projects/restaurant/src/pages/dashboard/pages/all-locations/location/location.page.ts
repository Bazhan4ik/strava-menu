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
            allowDelivery: boolean;
            allowTakeOut: boolean;
            allowDineIn: boolean;
        };
        methods: {
            card: boolean;
            cash: boolean;
        }
        tips: boolean;
        serviceFee: {
            amount: number;
            type: 1 | 2;
        } | null;
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

        try {
            const update: any = await this.service.put({ type: t, value: val }, "locations", this.location.id, "methods");
    
            if(!update.updated) {
                ev.target.checked = !val;
            }
        } catch (e) {
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

    async onServiceFeeEnabled(event: any) {
        const update: any = await this.service.put({ enabled: true, amount: 0, type: 1  }, "locations", this.location.id, "service-fee");

        this.location.settings.serviceFee = { amount: null!, type: 1, };

        if(!update.updated) {
            this.location.settings.serviceFee = null;
            event.target.checked = false;
        }
    }
    async onServiceFeeDisabled() {
        const update: any = await this.service.put({ enabled: false, amount: 0, type: 1  }, "locations", this.location.id, "service-fee");

        if(update.updated) {
            this.location.settings.serviceFee = null;
        }
    }
    async onServiceFeeTypeUpdated() {
        if(!this.location.settings.serviceFee) {
            return;
        }

        if(this.location.settings.serviceFee.type == 1) {
            this.location.settings.serviceFee.type = 2;
        } else {
            this.location.settings.serviceFee.type = 1;
        }

        this.location.settings.serviceFee.amount = null!;
    }
    async onServiceFeeUpdated() {
        if(!this.location.settings.serviceFee) {
            return;
        }

        if(!this.location.settings.serviceFee || this.location.settings.serviceFee.amount == 0) {
            return;
        }

        const update: any = await this.service.put({ enabled: true, type: this.location.settings.serviceFee.type, amount: this.location.settings.serviceFee.amount }, "locations", this.location.id, "service-fee");

        if(!update.updated) {
            this.location.settings.serviceFee = update.old;
        }
    }

    async onTipsChange(ev: any) {
        const value = ev.target.checked;

        const update: any = await this.service.put({ value }, "locations", this.location.id, "tips");

        if(!update.updated) {
            ev.target.checked = !value;
        }
    }


    async ngOnInit() {
        const locationId = this.route.snapshot.paramMap.get("locationId");

        const result: any = await this.service.get("locations", locationId!);

        this.location = result;

        console.log(result);
    }
}
