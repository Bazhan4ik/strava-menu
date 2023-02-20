import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewContainerRef, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { StripeElementsOptions } from '@stripe/stripe-js';
import { NgxStripeModule } from 'ngx-stripe';
import { firstValueFrom } from 'rxjs';
import { env } from 'environment/environment';
import { FormsModule } from '@angular/forms';


interface Dish {
    name: string;
    amount: number;
    price: number;
}

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.page.html',
    styleUrls: ['./checkout.page.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, NgxStripeModule, FormsModule]
})
export class CheckoutPage implements OnInit {

    dishes: Dish[];
    money: {
        total: number;
        subtotal: number;
        hst: number;
    }

    email: string;
    showEmailInput = false;

    elementsOptions: StripeElementsOptions = {
        locale: "en-CA",
    };

    loading = true;

    constructor(
        private service: CustomerService,
        private stripeService: StripeService,
        private router: Router,
    ) { };

    @ViewChild(StripePaymentElementComponent) paymentElement: StripePaymentElementComponent;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async pay() {
        this.loading = true;
        
        this.service.$payments.subscribe(async data => {
            if(data.types.includes("payment/succeeded")) {
                window.location.href = `${env.customerUrl}/${this.service.restaurant.id}/${this.service.locationId}/tracking`;
            }
        });

        const result = await firstValueFrom(
            this.stripeService.confirmPayment({
                elements: this.paymentElement.elements,
                redirect: 'if_required',
                confirmParams: {
                    receipt_email: this.email,
                }
            })
        )

        if(result.error) {
            console.error(" ON EEEEEEEEEEEERORRORORROORORO ");
        }
    }


    async cash() {
        const result: any = await this.service.put({ }, "session/request/cash");

        if(!result.updated) {
            return;
        }

        const { WaiterRequestModal } = await import("./../../components/waiter-request/waiter-request.modal");

        const component = this.modalContainer.createComponent(WaiterRequestModal);

        component.instance.request = result.request;

        component.instance.leave.subscribe((redirect: boolean) => {
            if(redirect) {
                window.location.href = `${env.customerUrl}/${this.service.restaurant.id}/${this.service.locationId}/tracking`;
            }
            component.destroy();
        });

    }


    async ngOnInit() {
        let result: {
            money: any;
            dishes: Dish[];
            clientSecret: string;
            email: string,
        } = null!;


        try {
            result = await this.service.get({}, "session/checkout");
        } catch (e: any) {
            if(e.status == 403) {
                if(e.error.reason == "PaymentState") {
                    console.error("PAYED");
                } else if(e.error.reason == "InvalidAmount") {
                    this.router.navigate([this.service.restaurant.id, this.service.locationId, "p"]);
                }
            }
            return;
        }

        
        this.money = result.money;
        this.dishes = result.dishes;
        this.elementsOptions.clientSecret = result.clientSecret;

        if(result.email) {
            this.showEmailInput = false;
            this.email = result.email;
        } else {
            this.showEmailInput = true;
        }

        setTimeout(() => {
            this.loading = false;
        }, 2000);

        console.log(result);
    }
}
