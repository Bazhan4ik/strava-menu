import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';




@Component({
    selector: 'app-main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss']
})
export class MainPage implements OnInit {

    restaurant: any;

    showPreview: boolean;


    constructor(
        private service: CustomerService,
        private router: Router,
    ) {
        this.router.events.subscribe(ev => {
            if(ev instanceof NavigationEnd) {
                this.showPreview = ev.url.split("?")[0].split("/")[3] != "p";
            }
        });
    }


    async ngOnInit() {
        this.restaurant = this.service.restaurant;


    }

}
