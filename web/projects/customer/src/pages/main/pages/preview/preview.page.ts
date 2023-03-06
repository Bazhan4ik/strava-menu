import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';




interface Dish {
    name: string;
    price: number;
    image: any;
    _id: string;
    comment: string;
    dishObjectId: string;
    dishId: string;
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

    subtotal: number;
    dishes: Dish[] = [];
    info: OrderInfo;
    settings: Settings;
    address: string;


    errors = {
        dishes: false,
        type: false,
    }


    constructor(
        private service: CustomerService,
        private router: Router,
    ) {};

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

    async dishMore(ev: any, dish: Dish) {
        
        const popoverPosition = ev.target.getBoundingClientRect(ev.target);

        const { DishMoreModal } = await import("./modals/dish-more/dish-more.modal");

        const component = this.modalContainer.createComponent(DishMoreModal);

        component.instance.position = { top: `${popoverPosition.top - 6}px`, left: `${popoverPosition.left - 160}px` };
        component.instance.isComment = !!dish.comment;


        component.instance.leave.subscribe(async (action: string) => {
            if(action == "comment") {
                const newComment = await this.getComment(dish.comment);

                if(newComment) {
                   
                    const update: any = await this.service.put({ comment: newComment }, "session/dish", dish._id, "comment");
                    
                    if(update.updated) {
                        dish.comment = newComment;

                        if(newComment == "remove") {
                            dish.comment = null!;
                        }
                    }
                }
            } else if(action == "remove") {
                const update: any = await this.service.delete("session/dish", dish._id);

                if(update.updated) {
                    for(let i in this.dishes) {
                        if(this.dishes[i]._id == dish._id) {
                            this.dishes.splice(+i, 1);
                            this.subtotal -= dish.price;
                            break;
                        }
                    }

                    for(let i in this.service.session.dishes) {
                        if(this.service.session.dishes[i]._id == dish._id) {
                            this.service.session.dishes.splice(+i, 1);
                            break;
                        }
                    }
                }
            } else if(action == "more") {
                this.router.navigate([this.service.restaurant.id, this.service.locationId, dish.dishId]);
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
        if(!this.dishes || this.dishes.length == 0) {
            this.errors.dishes = true;

            pass = false;
        } else {
            this.errors.dishes = false;
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
            dishes: Dish[];
            info: OrderInfo;
            subtotal: number;
            address: string;
            settings: Settings;
        } = await this.service.get({ }, "session/preview");

        if(!result) {
            return;
        }

        this.info = result.info;
        this.subtotal = result.subtotal;
        this.settings = result.settings;
        this.address = result.address;
        

        for(let dish of result.dishes) {
            this.dishes.push({
                ...dish,
                image: getImage(dish.image) || "./../../../../../../../global-resources/images/no-image.svg",
            });
        }

        console.log(result);
    }
}
