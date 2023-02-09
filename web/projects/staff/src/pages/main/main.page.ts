import { Component, OnInit } from '@angular/core';
import { env } from 'environment/environment';
import { StaffService } from '../../services/staff.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss']
})
export class MainPage implements OnInit {

    restaurant: any;
    dashboardUrl: string;

    constructor(
        private service: StaffService,
    ) {}


    ngOnInit(): void {
        this.restaurant = this.service.restaurant;
        this.dashboardUrl = env.restaurantUrl + "/dashboard/" + this.restaurant.id;
    }
}
