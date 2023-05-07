import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
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
interface Shift {
    startHours: number;
    startMinutes: number;
    endHours: number;
    endMinutes: number;
    days: number[];
    _id: string;
}


@Component({
    selector: 'app-worker',
    templateUrl: './worker.page.html',
    styleUrls: ['./worker.page.scss']
})
export class WorkerPage implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private service: RestaurantService,
        private router: Router,
    ) { };


    settings: any;
    locations: Location[];
    account: Account;
    shifts: Shift[] = [];
    avatar: string;

    showSettings = false;
    settingsLoading = false;


    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async ngOnInit() {
        const userId = this.route.snapshot.paramMap.get("userId");

        if(!userId || userId.length != 24) {
            return this.router.navigate([this.service.restaurant.id, "staff"]);
        }



        const result: { account: Account; shifts: Shift[]; locations: Location[]; settings: any; } = await this.service.get("staff", userId);

        if(!result) {
            return;
        }


        this.account = result.account;
        this.settings = result.settings;
        this.locations = result.locations;
        this.shifts = result.shifts;

        this.avatar = getImage(this.account.avatar) || "./../../../../../../../../global-resources/images/plain-avatar.jpg";
        

        return;
    }


    async deleteShift(shift: Shift) {
        const update: { updated: boolean; } = await this.service.delete("staff", this.account._id, "shifts", shift._id);

        if(update.updated) {
            for(const i in this.shifts) {
                if(this.shifts[i]._id == shift._id) {
                    this.shifts.splice(+i, 1);
                    break;
                }
            }
        }
    }
    async addShift() {
        const { WorkerShiftModal } = await import("./../../../components/worker-shift/worker-shift.modal");

        const component = this.modalContainer.createComponent(WorkerShiftModal);

        component.instance.title = "Add Shift";

        component.instance.leave.subscribe(async (shift) => {
            if(shift) {
                try {
                    
                    const update: { updated: boolean; } = await this.service.put({ shift: shift }, "staff", this.account._id, "shifts");
                    
                    if(update.updated) {
                        this.shifts.push(shift);
                        component.destroy();
                    }
                } catch (e: any) {
                    if(e.status == 400) {
                        if(e.error.reason == "ShiftsOverlap") {
                            component.instance.title = "Shifts Overlap";
                            component.instance.error = true;
                        }
                    }
                }
            } else {
                component.destroy();
            }
        });
    }
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
}
