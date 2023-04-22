import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewContainerRef, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { ItemsComponent } from './components/items/items.component';
import { OrderComponent } from './components/order/order.component';
import { Item, OrderInfo, Settings } from './models';
import { IonicModule } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { ItemsService } from 'projects/customer/src/services/items.service';






@Component({
    selector: 'app-preview',
    templateUrl: './preview.page.html',
    styleUrls: ['./preview.page.scss'],
    imports: [CommonModule, MatIconModule, RouterModule, ItemsComponent, OrderComponent, IonicModule],
    standalone: true,
})
export class PreviewPage implements OnInit {
    constructor(
        private service: CustomerService,
        private router: Router,
        private itemsService: ItemsService,
    ) {};

    subtotal: number;
    items: Item[] = [];
    orderInfo: OrderInfo;
    settings: Settings;
    address: string;
    changeSubscription: Subscription;
    loading: boolean = false;
    itemsLoading: boolean = false;
    fullItemUrl: string = "../../item";

    errors = {
        items: false,
        order: false,
    }


    @Input() mini = false;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async ngOnInit() {
        const result: {
            items: Item[];
            info: OrderInfo;
            subtotal: number;
            address: string;
            settings: Settings;
        } = await this.service.get({ }, "session/order/preview");

        if(!result) {
            return;
        }

        this.orderInfo = result.info;
        this.subtotal = result.subtotal;
        this.settings = result.settings;
        this.address = result.address;
        

        this.items = [];
        for(let item of result.items) {
            this.items.push({
                ...item,
                image: getImage(item.image) || "./../../../../../../../global-resources/images/no-image.svg",
            });
        }

        

        if(this.mini && !this.changeSubscription) {
            this.fullItemUrl = "../item";
            this.changeSubscription = this.itemsService.$previewUpdate.subscribe(async () => {
                this.itemsLoading = true;
                await this.ngOnInit();
                setTimeout(() => {
                    this.itemsLoading = false;
                }, 600);
            });
        }
    }


    changeSubtotal(amount: number) {
        this.subtotal = this.subtotal + amount;
    }
    getComment(comment?: string) {
        return new Promise<string>(async resolve => {
            const { CommentModal } = await import("./../../components/comment/comment.modal");
    
            const component = this.modalContainer.createComponent(CommentModal);
    
            component.instance.comment = comment || "";

            component.instance.leave.subscribe((newComment: string) => {
                if(newComment) {
                    resolve(newComment);
                }
                resolve(null!);
                component.destroy();
            });
        });
    }
    checkout() {
        let pass = true;
        if(!this.items || this.items.length == 0) {
            this.errors.items = true;

            pass = false;
        } else {
            this.errors.items = false;
        }
        if(this.orderInfo.type == "dinein" && !this.orderInfo.id) {
            this.errors.order = true;
            
            pass = false;
        } else {
            this.errors.order = false;
        }

        if(!pass) {
            return;
        }

        this.router.navigate([this.service.restaurant.id, this.service.locationId, "order", "checkout"]);
    }
    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
    }
}
