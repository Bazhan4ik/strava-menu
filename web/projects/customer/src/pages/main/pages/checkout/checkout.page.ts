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
interface PaymentData {
    clientSecret: string;
    setup: boolean;
    payment: boolean;
    tips: boolean;
    paymentMethods: PaymentMethod[];
}

interface PaymentMethod {
    id: string;
    last4: string;
    brand: string;
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
        service: number;
        tip: number;
    }

    email: string;
    showEmailInput = false;

    elementsOptions: StripeElementsOptions = {
        locale: "en-CA",
    };

    paymentData: PaymentData;

    payWithCash: boolean;
    payWithCard: boolean;

    paymentMethods: PaymentMethod[];
    selectedPaymentMethod?: PaymentMethod;


    loading = true;

    constructor(
        private service: CustomerService,
        private stripeService: StripeService,
        private router: Router,
    ) { };

    @ViewChild(StripePaymentElementComponent) paymentElement: StripePaymentElementComponent;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async confirm() {
        this.loading = true;
        
        this.service.$payments.subscribe(async data => {
            if(data.types.includes("payment/succeeded")) {
                window.location.href = `${env.customerUrl}/${this.service.restaurant.id}/${this.service.locationId}/order/tracking`;
            }
        });

        if(this.paymentData.payment) {

            if(this.selectedPaymentMethod) {
                const result = await firstValueFrom(
                    this.stripeService.confirmCardPayment(this.paymentData.clientSecret, { payment_method: this.selectedPaymentMethod.id })
                )

                return;
            }

            const result = await firstValueFrom(
                this.stripeService.confirmPayment({
                    elements: this.paymentElement.elements,
                    redirect: 'if_required',
                    confirmParams: {
                        receipt_email: this.email,
                    }
                })
            );
    
            if(result.error) {
                this.loading = false;
                console.error(" ON EEEEEEEEEEEERORRORORROORORO ");
            }

            return;
        }


        const result = await firstValueFrom(
            this.stripeService.confirmSetup({
                elements: this.paymentElement.elements,
                redirect: 'if_required',
            })
        );        

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
                window.location.href = `${env.customerUrl}/${this.service.restaurant.id}/${this.service.locationId}/order/tracking`;
            }
            component.destroy();
        });

    }

    selectPaymentMethod(method: PaymentMethod) {
        this.selectedPaymentMethod = method;
    }

    async removeTip() {
        const old = this.money.tip;
        this.money.total = +(this.money.total - this.money.tip).toFixed(2);
        this.money.tip = null!;

        const update: any = await this.service.delete("session/tip");
        
        if(!update.updated) {
            this.money.tip = old;
            this.money.total = +(this.money.total + this.money.tip).toFixed(2);
        }
    }
    async addTip(amount: number) {
        this.money.total -= this.money.tip;
        this.money.tip = Number((this.money.subtotal * amount / 100).toFixed(2));
        this.money.total = +(this.money.total + this.money.tip).toFixed(2);

        const update: any = await this.service.put({ amount }, "session/tip");

        if(!update.updated) {
            this.money.tip = null!;
        }
    }

    async ngOnInit() {
        let result: {
            money: any;
            dishes: Dish[];
            email: string,
            payWithCash: boolean;
            payWithCard: boolean;
            paymentData: PaymentData
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

        this.payWithCard = result.payWithCard;
        this.payWithCash = result.payWithCash;
        this.paymentData = result.paymentData;
        
        this.money = {
            tip: +(result.money.tip / 100).toFixed(2),
            subtotal: +(result.money.subtotal / 100).toFixed(2),
            total: +(result.money.total / 100).toFixed(2),
            service: +(result.money.service / 100).toFixed(2),
            hst: +(result.money.hst / 100).toFixed(2),
        };
        this.dishes = result.dishes;
        this.elementsOptions.clientSecret = result.paymentData.clientSecret;

        if(result.email) {
            this.showEmailInput = false;
            this.email = result.email;
        } else {
            this.showEmailInput = true;
        }


        setTimeout(() => {
            this.loading = false;
        }, 2000);
    }
}
