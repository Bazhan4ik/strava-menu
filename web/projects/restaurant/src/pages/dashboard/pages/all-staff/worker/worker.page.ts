import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';


interface Account {
    name: string;
    avatar: any;
    _id: string;
    email: string;
}
interface Location {
    name: string;
    _id: string;
    city: string;
    line1: string;
}


@Component({
    selector: 'app-worker',
    templateUrl: './worker.page.html',
    styleUrls: ['./worker.page.scss']
})
export class WorkerPage implements OnInit {


    settings: any;
    locations: Location[];
    account: Account;

    avatar: string;

    showSettings = false;
    settingsLoading = false;

    constructor(
        private route: ActivatedRoute,
        private service: RestaurantService,
        private router: Router,
    ) {};


    openSettings() {
        this.showSettings = true;
    }
    closeSettings() {
        this.showSettings = false;
    }


    onSettingsChange(newSettings: any) {
        this.settings = newSettings;
    }

    async saveSettings() {
        this.settingsLoading = true;

        let result: any;

        try {
            result = await this.service.put({ settings: this.settings }, "staff", this.account._id, "settings");
        } catch (e: any) {
            if(e.status == 403) {
                return; // trying to change own settings or settings of someone stronger than the user
            } else if(e.status == 400) {
                if(e.error.reason == "InvalidSettings") {
                    return; // invalid settings
                }
            }
        }


        if(!result.updated) {
            this.settingsLoading = false;
            return;
        }

        this.settingsLoading = false;
        this.showSettings = false;
    }


    async ngOnInit() {
        const userId = this.route.snapshot.paramMap.get("userId");

        if(!userId || userId.length != 24) {
            return this.router.navigate([this.service.restaurant.id, "staff"]);
        }



        const result: { account: Account; locations: Location[]; settings: any; } = await this.service.get("staff", userId);

        if(!result) {
            return;
        }


        this.account = result.account;
        this.settings = result.settings;
        this.locations = result.locations;

        this.avatar = getImage(this.account.avatar) || "./../../../../../../../../global-resources/images/plain-avatar.jpg";
        

        return;
    }
}
