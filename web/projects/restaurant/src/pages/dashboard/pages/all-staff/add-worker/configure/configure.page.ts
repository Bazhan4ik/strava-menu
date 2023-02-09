import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';




interface User {
    name: string;
    email: string;
    avatar: any;
    _id: string;
}

interface Location {
    name: string;
    city: string;
    line1: string;
    _id: string;
}




@Component({
    selector: 'app-configure',
    templateUrl: './configure.page.html',
    styleUrls: ['./configure.page.scss']
})
export class ConfigurePage implements OnInit {
    loading = false;
    user: User;
    locations: Location[];
    location: string;

    settings: any;


    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
        private router: Router,
    ) { };


    setSettings(newSettings: any) {
        console.log(newSettings);
        this.settings = newSettings;
    }

    async save() {
        if(!this.location) {
            return;
        }

        this.loading = true;

        const result: any = await this.service.post({ settings: this.settings, location: this.location, }, "staff/add", this.user._id);

        console.log(result);
        
        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "staff"])
        }


        this.loading = false;

    }

    selectLocation(id: string) {
        this.location = id;
    }




    async ngOnInit() {
        const userId = this.route.snapshot.paramMap.get("userId");

        if (!userId || userId.length != 24) {
            this.router.navigate([this.service.restaurant.id, "staff", "add"]);
            return;
        }

        let result: {
            user: User;
            locations: Location[];
        } = null!;

        try {
            result = await this.service.get("staff/add", userId);
        } catch (e: any) {
            if (e.status == 403) {
                if (e.error.reason == "UserAdded") {
                    this.router.navigate([this.service.restaurant.id, "staff", "add"]);
                    return;
                }
            } else if (e.status == 404) {
                if (e.error.reason == "UserNotFound") {
                    this.router.navigate([this.service.restaurant.id, "staff", "add"]);
                    return;
                }
            }
        }

        if (!result) {
            this.router.navigate([this.service.restaurant.id, "staff", "add"]);
            return;
        }

        console.log(result);

        this.user = result.user;
        this.locations = result.locations;
    }
}
