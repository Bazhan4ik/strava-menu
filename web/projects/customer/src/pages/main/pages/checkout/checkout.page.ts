import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { BillInfoComponent } from './components/bill-info/bill-info.component';
import { BillInfoMoney, BillInfoTips, CheckoutItem, PaymentData, Tips } from './models';
import { PaymentComponent } from './components/payment/payment.component';
import { Subscription } from 'rxjs';
import { ItemsService } from 'projects/customer/src/services/items.service';




@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.page.html',
    styleUrls: ['./checkout.page.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, BillInfoComponent, PaymentComponent]
})
export class CheckoutPage implements OnInit, OnDestroy {
    constructor(
        private service: CustomerService,
        private router: Router,
        private itemsService: ItemsService,
    ) { };


    backUrl: string = "../preview";
    paymentData: PaymentData;
    tips: Tips;
    subscription: Subscription;
    billInfo: {
        money: BillInfoMoney;
        tips: BillInfoTips;
        items: CheckoutItem[];
    }
    payment: {
        clientSecret: string;
        country: string;
        email: string;
    }

    @ViewChild(BillInfoComponent) billInfoComponent: BillInfoComponent;


    async ngOnInit() {
        let result: {
            paymentData: PaymentData;
            money: BillInfoMoney;
            items: CheckoutItem[];
            tips: Tips;

            country: string;
            email: string,
        } = null!;

        if(window.innerWidth > 1200) {
            this.backUrl = "../..";
        }

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

        this.tips = result.tips;
        this.paymentData = result.paymentData;
        this.payment = {
            clientSecret: result.paymentData.clientSecret,
            country: result.country,
            email: result.email,
        };
        this.billInfo = {
            money: result.money,
            items: result.items,
            tips: <any>{
                selected: result.tips.selectedTip,
                deliverySelected: result.tips.selectedDeliveryTip,
            },
        };

        console.log("BILL INFO CHANGED");
    }
    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
    async ionViewWillEnter() {
        if(!this.billInfo) {
            return;
        }
        console.log("VIEW ENTER ON CHECKOUT");
        await this.ngOnInit();
        this.billInfoComponent?.ngOnInit();
    }
}
