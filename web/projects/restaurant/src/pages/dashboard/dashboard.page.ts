import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.page.html',
    styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage {
    currentPage: string;
    restaurant: { name: string; };

    constructor(
        private router: Router,
        private service: RestaurantService,
    ) {
        this.router.events.subscribe(event => {
            if(event instanceof NavigationEnd) {
                const url = event.url.split('?')[0]; 
                const secondParam = url.split('/')[2];

                this.currentPage = secondParam;
            }
        });

        this.restaurant = this.service.restaurant;
    };
}
