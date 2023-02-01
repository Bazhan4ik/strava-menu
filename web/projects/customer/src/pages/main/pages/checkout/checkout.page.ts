import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { StripePaymentElementComponent } from 'ngx-stripe';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { StripeElementsOptions } from '@stripe/stripe-js';
import { NgxStripeModule } from 'ngx-stripe';


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
    imports: [CommonModule, MatIconModule, RouterModule, NgxStripeModule]
})
export class CheckoutPage implements OnInit {

    dishes: Dish[];
    money: {
        total: number;
        subtotal: number;
        hst: number;
    }

    elementsOptions: StripeElementsOptions = {
        locale: 'en'
    };
    
    constructor(
        private service: CustomerService,
    ) {};

    @ViewChild(StripePaymentElementComponent) paymentElement: StripePaymentElementComponent;





    async ngOnInit() {
        const result: {
            money: any;
            dishes: Dish[];
            clientSecret: string;
        } = await this.service.get({}, "session/checkout");

        this.money = result.money;
        this.dishes = result.dishes;

        this.elementsOptions.clientSecret = result.clientSecret;
        
        
        console.log(result);
    }
}
