import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';




interface Item {
    name: string;
    price: number;
    image: any;
    _id: string;
    comment: string;
    itemObjectId: string;
    itemId: string;
}
interface OrderInfo {
    id: string;
    type: "dinein" | "takeout";
    comment: string;
}
interface Settings {
    allowOrderingOnline: boolean;
    allowDineIn: boolean;
    allowTakeOut: boolean;
}



@Component({
    selector: 'app-preview',
    templateUrl: './preview.page.html',
    styleUrls: ['./preview.page.scss'],
    imports: [CommonModule, MatIconModule, RouterModule],
    standalone: true,
})
export class PreviewPage implements OnInit {
    constructor(
        private service: CustomerService,
        private router: Router,
    ) {};

    subtotal: number;
    items: Item[] = [];
    info: OrderInfo;
    settings: Settings;
    address: string;

    loading: boolean = false;

    errors = {
        items: false,
        type: false,
    }

    backUrl: string;



    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


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

    async updateModifiers(item: Item) {
        const { ModifiersModalModal } = await import("./../../components/modifiers-modal/modifiers-modal.modal");

        const component = this.modalContainer.createComponent(ModifiersModalModal);

        component.instance.itemId = item.itemObjectId;
        component.instance.sessionItemId = item._id;

        component.instance.leave.subscribe(async (m: any) => {
            if(m) {

                const update: any = await this.service.put({ modifiers: m }, "session/item", item._id, `modifiers?itemId=${item.itemObjectId}`);

                if(update.updated) {
                    this.subtotal -= item.price;
                    item.price = update.newPrice;
                    this.subtotal += item.price;
                }

            }
            component.destroy();
        });

    }

    async itemMore(ev: any, item: Item) {
        
        const popoverPosition = ev.target.getBoundingClientRect(ev.target);

        const { ItemMoreModal } = await import("./modals/item-more/item-more.modal");

        const component = this.modalContainer.createComponent(ItemMoreModal);

        component.instance.position = { top: `${popoverPosition.top - 6}px`, left: `${popoverPosition.left - 160}px` };
        component.instance.isComment = !!item.comment;


        component.instance.leave.subscribe(async (action: string) => {
            if(action == "comment") {
                const newComment = await this.getComment(item.comment);

                if(newComment) {
                   
                    const update: any = await this.service.put({ comment: newComment }, "session/item", item._id, "comment");
                    
                    if(update.updated) {
                        item.comment = newComment;

                        if(newComment == "remove") {
                            item.comment = null!;
                        }
                    }
                }
            } else if(action == "remove") {
                const update: any = await this.service.delete("session/item", item._id);

                if(update.updated) {
                    for(let i in this.items) {
                        if(this.items[i]._id == item._id) {
                            this.items.splice(+i, 1);
                            this.subtotal -= item.price;
                            break;
                        }
                    }

                    for(let i in this.service.session.items) {
                        if(this.service.session.items[i]._id == item._id) {
                            this.service.session.items.splice(+i, 1);
                            break;
                        }
                    }
                }
            } else if(action == "more") {
                this.router.navigate([this.service.restaurant.id, this.service.locationId, "item", item.itemId], { queryParams: { back: this.backUrl } });
            } else if(action == "modifiers") {
                this.updateModifiers(item);
            }

            component.destroy();
        });
        

        console.log(popoverPosition);
    }

    async selectType(type: "dinein" | "takeout") {
        if(this.info.type == type) {
            return;
        }
        this.errors.type = false;
        const result: any = await this.service.put({ type }, "session/type");

        if(result.updated) {
            this.info.type = type;

            this.info.id = result.id;
        }
    }

    async setComment() {
        const comment = await this.getComment(this.info.comment);

        if(!comment) {
            return;
        }

        const update: any = await this.service.put({ comment }, "session/comment");

        if(update.updated) {
            this.info.comment = comment;

            if(comment == "remove") {
                this.info.comment = null!;
            }
        }
    }

    checkout() {
        let pass = true;
        if(!this.items || this.items.length == 0) {
            this.errors.items = true;

            pass = false;
        } else {
            this.errors.items = false;
        }
        if(this.info.type == "dinein" && !this.info.id) {
            this.errors.type = true;
            
            pass = false;
        } else {
            this.errors.type = false;
        }

        if(!pass) {
            return;
        }

        this.router.navigate([this.service.restaurant.id, this.service.locationId, "order", "checkout"]);
    }

    async changeTable() {
        const { ScanQrCodeModal } = await import("./modals/scan-qr-code/scan-qr-code.modal");

        const component = this.modalContainer.createComponent(ScanQrCodeModal);   


        component.instance.leave.subscribe(async (table: string) => {
            component.destroy();
            if(table) {
                
                const update: any = await this.service.put({ table }, "session/table");

                if(update.updated) {
                    this.info.id = update.table;
                    this.service.session.id = update.table;
                }

            }
        });
    }


    async ngOnInit() {
        const result: {
            items: Item[];
            info: OrderInfo;
            subtotal: number;
            address: string;
            settings: Settings;
        } = await this.service.get({ }, "session/preview");

        if(!result) {
            return;
        }

        this.backUrl = this.router.url;

        this.info = result.info;
        this.subtotal = result.subtotal;
        this.settings = result.settings;
        this.address = result.address;
        

        for(let item of result.items) {
            this.items.push({
                ...item,
                image: getImage(item.image) || "./../../../../../../../global-resources/images/no-image.svg",
            });
        }

        console.log(result);
    }
}
