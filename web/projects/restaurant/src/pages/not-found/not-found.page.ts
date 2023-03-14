import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
    selector: 'app-not-found',
    templateUrl: './not-found.page.html',
    styleUrls: ['./not-found.page.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule],
})
export class NotFoundPage implements OnInit {

    constructor(
        private service: RestaurantService,
        private router: Router,
    ) {}

    dashboardUrl: string;

    ngOnInit() {
        if(this.service.restaurant?.id) {
            this.dashboardUrl = `/${this.service.restaurant.id}`;
        } else {
            const url = this.router.url;

            const splitted = url.split("/");

            const restaurantId = splitted[1]; // supposedly restaurant id

            this.dashboardUrl = `/${restaurantId}`;
        }
    }
}
