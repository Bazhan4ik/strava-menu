import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CustomerService } from '../../services/customer.service';




@Component({
    selector: 'app-main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss']
})
export class MainPage implements OnInit {
    constructor(
        private service: CustomerService,
    ) { };

 


    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;



    async ngOnInit() {

        this.service.$delivery.subscribe(data => {
            console.log(data);
            if(data.types.includes("delivery/validation")) {
                this.updateDeliveryAddress(data.data.sessionId);
            }
        });


        const failedDeliverySessions: { _id: string }[] = await this.service.get({}, "session/delivery/check");
        
        console.log(failedDeliverySessions);

        if(failedDeliverySessions.length > 0) {
            for(const session of failedDeliverySessions) {
                
                this.updateDeliveryAddress(session._id);

            }
        }

        // const link = this.renderer.createElement('link');
        // link.setAttribute('rel', 'stylesheet');
        // link.setAttribute('type', 'text/css');
        // link.setAttribute('href', 'https://api.mydomain.com:3000/themes/default.css');
        // this.renderer.appendChild(document.head, link);
    }



    async updateDeliveryAddress(sessionId: string) {
        const { DeliveryAddressModal } = await import("./pages/preview/modals/delivery-address/delivery-address.modal");

        const component = this.modalContainer.createComponent(DeliveryAddressModal);

        component.instance.error = true;

        component.instance.leave.subscribe(async (address) => {
            const update: { updated: boolean; reason: "validation"; } = await this.service.put(address, "session/delivery/address", sessionId);

            if(update.updated) {
                component.destroy();
                return;
            }

            if(update.reason == "validation") {
                this.updateDeliveryAddress(sessionId);

                component.destroy();
                return;
            }
        });
    }
}
