import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { env } from 'environment/environment';
import { StaffService } from '../../services/staff.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss']
})
export class MainPage implements OnInit {

    restaurant: any;
    redirectUrl: string;
    redirectText: string;

    constructor(
        private service: StaffService,
    ) { };

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async addOrder() {
        const { AddOrderModal } = await import("./components/add-order/add-order.modal");

        const component = this.modalContainer.createComponent(AddOrderModal);

        component.instance.leave.subscribe(() => {
            component.destroy();
        });

    }





    ngOnInit(): void {
        this.restaurant = this.service.restaurant;

        if(this.restaurant.redirectTo == "dashboard") {
            this.redirectText = "Dashboard";
            this.redirectUrl = env.restaurantUrl + "/dashboard/" + this.restaurant.id;
        } else {
            this.redirectText = "Account";
            this.redirectUrl = env.accountUrl + "/home";
        }
        
    }
}
