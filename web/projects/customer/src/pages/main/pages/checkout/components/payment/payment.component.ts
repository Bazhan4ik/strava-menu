import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxStripeModule, StripePaymentElementComponent, StripeService } from 'ngx-stripe';
import { StripeElementsOptions, StripePaymentElementOptions } from '@stripe/stripe-js';
import { PaymentData, PaymentMethod } from '../../models';
import { env } from 'environment/environment';
import { firstValueFrom } from 'rxjs';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { PaymentCardComponent } from '../payment-card/payment-card.component';



@Component({
    selector: 'app-payment',
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.scss'],
    standalone: true,
    imports: [CommonModule, NgxStripeModule, FormsModule, PaymentCardComponent]
})
export class PaymentComponent implements OnInit {
    constructor(
        private service: CustomerService,
        private stripeService: StripeService,
    ) { };


    loading = false;
    selectedPaymentMethod?: PaymentMethod;
    showEmailInput = false;
    paymentError = false;
    
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


    @Input() paymentData: PaymentData;
    @Input() email: string;
    @Input() country: string;

    @ViewChild(StripePaymentElementComponent) paymentElement: StripePaymentElementComponent;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @ViewChild(PaymentCardComponent) paymentCard: PaymentCardComponent;


    ngOnInit() {
        this.showEmailInput = !this.email;
        this.elementsOptions.clientSecret = this.paymentData.clientSecret;
    }



    async pay() {
        const cardData = this.paymentCard.getCardInfo(this.paymentData.encryptionKey);

        if(!cardData) {
            return;
        }

        this.loading = true;

        try {
            const result: any = await this.service.post({ cardData }, "session/checkout/elvn/pay");
            
            if(result.success) {
                window.location.href = `${env.customerUrl}/${this.service.restaurant.id}/${this.service.locationId}/order/tracking`;
            }

        } catch (error: any) {
            console.error(error);


            const status = error.status;
            const reason = error.error.reason;

            if(status == 400) {
                if(reason == "PaymentFailed") {
                    this.paymentError = true;
                }
            }

            this.loading = false;
        }

    }
    async payStripe() {
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

        const { WaiterRequestModal } = await import("./../../../../components/waiter-request/waiter-request.modal");

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
}
