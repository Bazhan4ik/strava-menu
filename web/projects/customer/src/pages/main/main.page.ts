import { Component, OnInit, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from '../../services/customer.service';




@Component({
    selector: 'app-main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss']
})
export class MainPage implements OnInit {

    restaurant: any;

    showPreview: boolean;

    showTracking: boolean;

    showPopover: boolean;
    popoverPosition: {
        x: number;
        y: number;
    }

    constructor(
        private service: CustomerService,
        private router: Router,
        private renderer: Renderer2,
    ) {

        this.router.events.subscribe(ev => {
            if(ev instanceof NavigationEnd) {
                this.showPreview = ev.url.split("?")[0].split("/")[3] != "p" && ev.url.split("?")[0].split("/")[3] != "tracking";
            }
        });
    }

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    closePopover() {
        this.showPopover = false;
    }

    goTracking() {
        this.router.navigate([this.service.restaurant.id, this.service.locationId, "tracking"]);
        this.showPopover = false;
    }
    goAccount() {
        window.location.href = env.accountUrl + "/home";
        this.showPopover = false;
    }

    openButtons(e: any) {
        const pos = e.target.getBoundingClientRect(e.target);

        this.popoverPosition = {
            x: pos.right - 234,
            y: pos.top + 32,
        };

        this.showPopover = true;
    }


    async openWaiterRequest() {
        const { WaiterRequestModal } = await import("./components/waiter-request/waiter-request.modal");

        const component = this.modalContainer.createComponent(WaiterRequestModal);

        component.instance.request = this.service.session.waiterRequest;

        component.instance.leave.subscribe((redirect: boolean) => {
            if(redirect) {
                this.router.navigate([this.service.restaurant.id, this.service.locationId]);
            }
            component.destroy();
        });
    }

    async ngOnInit() {
        this.restaurant = this.service.restaurant;
        this.showTracking = this.service.showTracking;
        
        if(this.service.session.waiterRequest) {
            this.openWaiterRequest();
        }







        // const link = this.renderer.createElement('link');
        // link.setAttribute('rel', 'stylesheet');
        // link.setAttribute('type', 'text/css');
        // link.setAttribute('href', 'https://api.mydomain.com:3000/themes/default.css');
        // this.renderer.appendChild(document.head, link);
    }

}
