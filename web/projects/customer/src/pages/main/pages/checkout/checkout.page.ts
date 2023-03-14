import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewContainerRef, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { StripeElementsOptions, StripePaymentElementOptions } from '@stripe/stripe-js';
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
        total: string;
        subtotal: string;
        hst: string;
        service: string;
        tip: string;
    }

    tips?: {
        value10: string;
        value15: string;
        value20: string;
        selected: string;
    }

    email: string;
    country: string;
    showEmailInput = false;

    options: Partial<StripePaymentElementOptions> = {
        fields: {
            billingDetails: {
                address: {
                    country: "never",
                }
            }
        }
    }

    elementsOptions: StripeElementsOptions = {
        locale: "en-CA",

        appearance: {
            "theme": "stripe",
            disableAnimations: true,
            variables: {
                "colorPrimary": "#FFC409",
                "borderRadius": "4px",
                "focusOutline": "2px solid #FFC409",
                // "focusBoxShadow": "none",
            },
        }
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
        if (!this.email) {
            return;
        }

        this.loading = true;

        this.service.$payments.subscribe(async data => {
            if (data.types.includes("payment/succeeded")) {
                window.location.href = `${env.customerUrl}/${this.service.restaurant.id}/${this.service.locationId}/order/tracking`;
            }
        });

        if (this.paymentData.payment) {

            if (this.selectedPaymentMethod) {
                const result = await firstValueFrom(
                    this.stripeService.confirmCardPayment(
                        this.paymentData.clientSecret,
                        {
                            payment_method: this.selectedPaymentMethod.id,
                        }
                    )
                )

                return;
            }

            const result = await firstValueFrom(
                this.stripeService.confirmPayment({
                    elements: this.paymentElement.elements,
                    redirect: 'if_required',
                    confirmParams: {
                        receipt_email: this.email,
                        payment_method_data: {
                            billing_details: {
                                email: this.email,
                                address: {
                                    country: this.country,
                                }
                            }
                        }
                    }
                })
            );

            if (result.error) {
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
        const result: any = await this.service.put({}, "session/request/cash");

        if (!result.updated) {
            return;
        }

        const { WaiterRequestModal } = await import("./../../components/waiter-request/waiter-request.modal");

        const component = this.modalContainer.createComponent(WaiterRequestModal);

        component.instance.request = result.request;

        component.instance.leave.subscribe((redirect: boolean) => {
            if (redirect) {
                window.location.href = `${env.customerUrl}/${this.service.restaurant.id}/${this.service.locationId}/order/tracking`;
            }
            component.destroy();
        });

    }

    selectPaymentMethod(method: PaymentMethod) {
        this.selectedPaymentMethod = method;
    }

    /**
     * 
     * @param amount amount of the tip, for example $5 would be 500 cents 
     * @param percentage percentage of the tip. should be saved so then when checkout reloaded tip option will be selected
     * @returns the tip amount which is % 25 == 0
     */
    calculateTip(amount: number, percentage: number): number {
        const result = amount * (percentage / 100);
        const remainder = result % 25;
        
        return result - remainder;
    }

    async removeTip() {
        const old = this.money.tip;
        this.money.total = (+this.money.total - +this.money.tip).toFixed(2);
        this.money.tip = null!;
        this.tips!.selected = null!;

        const update: any = await this.service.delete("session/tip");

        if (!update.updated) {
            this.money.tip = old;
            this.money.total = (+this.money.total + +this.money.tip).toFixed(2);
        }
    }
    async addTip(percentage: number) {
        const amount = this.calculateTip(+this.money.subtotal * 100, percentage);

        this.money.tip = (amount / 100).toFixed(2);
        this.tips!.selected = percentage.toString();
        

        const update: any = await this.service.put({ amount: amount, percentage: percentage }, "session/tip");

        if (!update.updated) {
            this.money.tip = null!;
        }
    }
    async customTip() {
        const { CustomTipModal } = await import("./../../components/custom-tip/custom-tip.modal");

        const component = this.modalContainer.createComponent(CustomTipModal);

        component.instance.leave.subscribe(async (amount: number) => {
            if (amount) {
                const update: { updated: boolean; } = await this.service.put({ amount: +amount.toFixed(2) * 100 }, "session/tip");

                if (update.updated) {
                    this.tips!.selected = "custom";
                    this.money.tip = amount.toFixed(2);
                }

            }
            component.destroy();
        });
    }

    async ngOnInit() {
        let result: {
            money: any;
            dishes: Dish[];
            email: string,
            payWithCash: boolean;
            payWithCard: boolean;
            paymentData: PaymentData;
            selectedTip: string;
            country: string;
        } = null!;


        try {
            result = await this.service.get({}, "session/checkout");
        } catch (e: any) {
            if (e.status == 403) {
                if (e.error.reason == "PaymentState") {
                    console.error("PAYED");
                } else if (e.error.reason == "InvalidAmount") {
                    this.router.navigate([this.service.restaurant.id, this.service.locationId, "p"]);
                }
            }
            return;
        }

        this.payWithCard = result.payWithCard;
        this.payWithCash = result.payWithCash;
        this.paymentData = result.paymentData;

        this.country = result.country;

        this.money = result.money;
        this.tips = {
            value10: (this.calculateTip(+this.money.subtotal * 100, 10) / 100).toFixed(2),
            value15: (this.calculateTip(+this.money.subtotal * 100, 15) / 100).toFixed(2),
            value20: (this.calculateTip(+this.money.subtotal * 100, 20) / 100).toFixed(2),
            selected: result.selectedTip
        }
        this.dishes = result.dishes;
        this.elementsOptions.clientSecret = result.paymentData.clientSecret;

        if (result.email) {
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
