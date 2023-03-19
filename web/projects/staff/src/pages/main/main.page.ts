import { Component, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { env } from 'environment/environment';
import { StaffService } from '../../services/staff.service';

@Component({
    selector: 'app-main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss']
})
export class MainPage implements OnInit {

    restaurant: any;
    redirectUrl: string;
    redirectText: string;

    waiter: {
        body: ComponentRef<any>;
        type: "singles" | "folders";
        switchType: Function;
        showDefault: Function;
        showFolders: Function;
    } = {
            body: null!,
            type: "singles",
            showFolders: async () => {
                const { FoldersWaiterComponent } = await import("./components/waiter/folders-waiter/folders-waiter.component");

                this.waiter.body = this.waiterBodyContainer.createComponent(FoldersWaiterComponent);
            },
            showDefault: async () => {
                const { ItemsWaiterComponent } = await import("./components/waiter/items-waiter/items-waiter.component");

                this.waiter.body = this.waiterBodyContainer.createComponent(ItemsWaiterComponent);
            },
            switchType: async () => {
                this.waiter.body.destroy();

                if (this.waiter.type == "singles") {
                    this.waiter.type = "folders";
                    this.waiter.showFolders();
                } else {
                    this.waiter.type = "singles";
                    this.waiter.showDefault();
                }
            }
        }

    cook: {
        body: ComponentRef<any>;
        type: "singles" | "folders";
        switchType: Function;
        showDefault: Function;
        showFolders: Function;
    } = {
            body: null!,
            type: "singles",
            showFolders: async () => {
                const { FoldersCookComponent } = await import("./components/cook/folders-cook/folders-cook.component");

                this.cook.body = this.cookBodyContainer.createComponent(FoldersCookComponent);
            },
            showDefault: async () => {
                const { ItemsCookComponent } = await import("./components/cook/items-cook/items-cook.component");

                this.cook.body = this.cookBodyContainer.createComponent(ItemsCookComponent);
            },
            switchType: async () => {
                this.cook.body.destroy();

                if (this.cook.type == "singles") {
                    this.cook.type = "folders";
                    this.cook.showFolders();
                } else {
                    this.cook.type = "singles";
                    this.cook.showDefault();
                }
            }
        }

    constructor(
        private service: StaffService,
    ) { };

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @ViewChild("cookBodyContainer", { read: ViewContainerRef }) cookBodyContainer: ViewContainerRef;
    @ViewChild("waiterBodyContainer", { read: ViewContainerRef }) waiterBodyContainer: ViewContainerRef;

    async addOrder() {
        const { AddOrderModal } = await import("./components/add-order/add-order.modal");

        const component = this.modalContainer.createComponent(AddOrderModal);

        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }




    ngOnInit(): void {
        this.restaurant = this.service.restaurant;

        if (this.restaurant.redirectTo == "dashboard") {
            this.redirectText = "Dashboard";
            this.redirectUrl = env.restaurantUrl + "/dashboard/" + this.restaurant.id;
        } else {
            this.redirectText = "Account";
            this.redirectUrl = env.accountUrl + "/home";
        }

        if (this.restaurant.pages.cook) {
            this.cook.showDefault();
        }
        if (this.restaurant.pages.waiter) {
            this.waiter.showDefault();
        }
    }
}
