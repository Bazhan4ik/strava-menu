import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { env } from 'environment/environment';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.page.html',
    styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
    accountUrl: string;
    staffUrl: string;

    currentPage: string;

    menuOpen = false;

    restaurant: { name: string; };
    pages: {
        menu: boolean;
        settings: boolean;
        analytics: boolean;
        customers: boolean;
        locations: boolean;
        orders: boolean;
        staff: boolean;
        tables: boolean;
    }

    constructor(
        private router: Router,
        private service: RestaurantService,
    ) {
        this.accountUrl = env.accountUrl + "/home";
        this.staffUrl = env.restaurantUrl + "/staff/" + this.service.restaurant.id;

        this.router.events.subscribe(event => {
            if(event instanceof NavigationEnd) {
                const url = event.url.split('?')[0]; 
                const secondParam = url.split('/')[2];

                this.currentPage = secondParam;
            }
        });

        this.restaurant = this.service.restaurant;

        this.pages = this.service.restaurant.pages;
    };

    openMenu() {
        this.menuOpen = !this.menuOpen;
    }

    ngOnInit(): void {
        const url = this.router.url.split('?')[0]; 
        const secondParam = url.split('/')[2];

        this.currentPage = secondParam;
    }
}
