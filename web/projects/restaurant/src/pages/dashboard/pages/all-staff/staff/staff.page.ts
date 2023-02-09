import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';


interface Worker {
    name: string;
    avatar: any;
    _id: string;

    location?: {
        id: string;
        name: string;
    };
}


@Component({
    selector: 'app-staff',
    templateUrl: './staff.page.html',
    styleUrls: ['./staff.page.scss']
})
export class StaffPage implements OnInit {
    staff: Worker[];

    constructor(
        private service: RestaurantService,
    ) {}


    async ngOnInit() {
        const result: Worker[] = await this.service.get("staff");


        if(result) {
            this.staff = [];

            for(let worker of result) {
                this.staff.push({
                    ...worker,
                    avatar: getImage(worker.avatar) || "./../../../../../../../../global-resources/images/plain-avatar.jpg",
                });
            }
        }


        console.log(result);
    }
}
