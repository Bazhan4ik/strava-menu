import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Address, OrderInfo, Settings } from '../../models';
import { ItemsService } from 'projects/customer/src/services/items.service';

@Component({
    selector: 'app-order',
    templateUrl: './order.component.html',
    styleUrls: ['./order.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule,]
})
export class OrderComponent implements OnInit {
    constructor(private service: CustomerService, private itemsService: ItemsService) { };

    orderingTimes: { value: Date; title: string; }[];
    hasModalOpen = false;

    @Input() hasError: boolean;
    @Input() order: OrderInfo
    @Input() getComment: Function;
    @Input() settings: Settings;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;




    ngOnInit() {
    }

    async changeTable() {
        this.hasModalOpen = true;
        const { ScanQrCodeModal } = await import("../../modals/scan-qr-code/scan-qr-code.modal");

        const component = this.modalContainer.createComponent(ScanQrCodeModal);


        component.instance.leave.subscribe(async (table: string) => {
            component.destroy();
            this.hasModalOpen = false;
            if (table) {

                const update: any = await this.service.put({ table }, "session/order/table");

                if (update.updated) {
                    this.order.id = update.table;
                    this.service.session.id = update.table;
                }

            }
        });

    }
    async selectType(type: "dinein" | "takeout" | "delivery") {
        if (this.order.type == type) {
            return;
        }
        this.hasError = false;

        const result: any = await this.service.put({ type }, "session/order/type");

        if (result.updated) {
            this.order.type = type;
            this.order.id = result.id;
            this.itemsService.$checkoutUpdate.next(true);

            if (type == "dinein") {
                this.changeTable();
            } else if (type == "delivery") {
                this.getAddress();
            }
        }
    }
    async setComment() {
        this.hasModalOpen = true;
        const comment = await this.getComment(this.order.comment);
        this.hasModalOpen = false;
        
        if (!comment) {
            return;
        }

        const update: any = await this.service.put({ comment }, "session/order/comment");

        if (update.updated) {
            this.order.comment = comment;

            if (comment == "remove") {
                this.order.comment = null!;
            }
        }
    }
    async getAddress() {
        this.hasModalOpen = true;
        const { DeliveryAddressModal } = await import("./../../modals/delivery-address/delivery-address.modal");

        const component = this.modalContainer.createComponent(DeliveryAddressModal);

        if (this.order.delivery?.address) {
            component.instance.address = this.order.delivery.address;
            component.instance.phone = this.order.delivery.phone;
            component.instance.time = this.order.delivery.time;
        }


        component.instance.leave.subscribe(async (address: Address) => {
            if(!this.order.delivery && address) {
                this.order.delivery = <any>{};
            }
            if(address) {
                this.order.delivery.address = address;
                this.order.delivery.phone = (address as any).phone;
                this.itemsService.$checkoutUpdate.next(true);
            }
            
            component.destroy();
            this.hasModalOpen = false;
        });


    }
}
