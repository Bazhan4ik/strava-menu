import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { BillInfoMoney, BillInfoTips, CheckoutItem, PaymentData, Tips } from '../../models';
import { CustomerService } from 'projects/customer/src/services/customer.service';

@Component({
    selector: 'app-bill-info',
    templateUrl: './bill-info.component.html',
    styleUrls: ['./bill-info.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class BillInfoComponent {
    constructor(
        private service: CustomerService,
    ) { };

    @Input() money: BillInfoMoney;
    @Input() items: CheckoutItem[];
    @Input() billTips: BillInfoTips;
    @Input() tips: Tips;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    ngOnInit() {
        console.log("BILL INFO INIT");
        console.log(this.money.subtotal);
        this.billTips = {
            ...this.billTips,
            value10: (this.calculateTip(+this.money.subtotal * 100, 10) / 100).toFixed(2),
            value15: (this.calculateTip(+this.money.subtotal * 100, 15) / 100).toFixed(2),
            value20: (this.calculateTip(+this.money.subtotal * 100, 20) / 100).toFixed(2),
        }
    }


    
    tip = {
        add: async (percentage: number) => {
            const amount = this.calculateTip(+this.money.subtotal * 100, percentage);

            const oldTip = +this.money.tip || 0;

            this.money.total = (+this.money.total - oldTip).toFixed(2);
            this.money.tip = (amount / 100).toFixed(2);
            this.money.total = (+this.money.total + +this.money.tip).toFixed(2);
            this.billTips!.selected = percentage.toString();


            const update: any = await this.service.put({ amount: amount, percentage: percentage }, "session/tip");

            if (!update.updated) {
                this.money.total = (+this.money.total - +this.money.tip + oldTip).toFixed(2);
                this.money.tip = oldTip.toFixed(2);
            }
        },
        addDelivery: async (percentage: number) => {
            const amount = this.calculateTip(+this.money.subtotal * 100, percentage);

            this.money.deliveryTip = (amount / 100).toFixed(2);
            this.billTips!.deliverySelected = percentage.toString();


            const update: any = await this.service.put({ amount: amount, percentage: percentage }, "session/tip/delivery");

            if (!update.updated) {
                this.money.deliveryTip = null!;
            }
        },
        custom: async () => {
            const { CustomTipModal } = await import("./../../../../components/custom-tip/custom-tip.modal");

            const component = this.modalContainer.createComponent(CustomTipModal);

            component.instance.leave.subscribe(async (amount: number) => {
                if (amount) {
                    const update: { updated: boolean; } = await this.service.put({ amount: +amount.toFixed(2) * 100 }, "session/tip");

                    if (update.updated) {
                        this.billTips!.selected = "custom";
                        this.money.tip = amount.toFixed(2);
                    }

                }
                component.destroy();
            });
        },
        customDelivery: async () => {
            const { CustomTipModal } = await import("./../../../../components/custom-tip/custom-tip.modal");

            const component = this.modalContainer.createComponent(CustomTipModal);

            component.instance.leave.subscribe(async (amount: number) => {
                if (amount) {
                    const update: { updated: boolean; } = await this.service.put({ amount: +amount.toFixed(2) * 100 }, "session/tip/delivery");

                    if (update.updated) {
                        this.billTips!.deliverySelected = "custom";
                        this.money.deliveryTip = amount.toFixed(2);
                    }

                }
                component.destroy();
            });
        },
        remove: async () => {
            const old = this.money.tip;
            this.money.total = (+this.money.total - +this.money.tip).toFixed(2);
            this.money.tip = null!;
            this.billTips!.selected = null!;

            const update: any = await this.service.delete("session/tip");

            if (!update.updated) {
                this.money.tip = old;
                this.money.total = (+this.money.total + +this.money.tip).toFixed(2);
            }
        },
        removeDelivery: async () => {
            const old = this.money.deliveryTip;
            this.money.total = (+this.money.total - +this.money.deliveryTip).toFixed(2);
            this.money.deliveryTip = null!;
            this.billTips!.deliverySelected = null!;

            const update: any = await this.service.delete("session/tip/delivery");

            if (!update.updated) {
                this.money.deliveryTip = old;
                this.money.total = (+this.money.total + +this.money.deliveryTip).toFixed(2);
            }
        },
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
}