import { Component } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';


interface User {
    name: string;
    _id: string;
    email: string;
    avatar: any;
}


@Component({
    selector: 'app-search',
    templateUrl: './search.page.html',
    styleUrls: ['./search.page.scss']
})
export class SearchPage {
    searchText: string;
    loading: boolean;
    users: User[];




    constructor(
        private service: RestaurantService,
    ) {}




    async search() {
        this.loading = true;
        const result: User[] = await this.service.get(`staff/add/find?text=${encodeURIComponent(this.searchText)}`);


        if(result) {
            this.users = [];

            for(let user of result) {
                user.avatar = getImage(user.avatar) || "./../../../../../../../../../global-resources/images/plain-avatar.jpg";
            }

            this.users = result;
        }

        this.loading = false;


        console.log(result);

    }
}
