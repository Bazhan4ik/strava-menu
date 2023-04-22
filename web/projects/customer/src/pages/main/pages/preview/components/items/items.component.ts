import { CommonModule } from '@angular/common';
import { Component, Input, ViewContainerRef, Output, ViewChild, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Item } from '../../models';
import { ItemsService } from 'projects/customer/src/services/items.service';

@Component({
    selector: 'app-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule],
})
export class ItemsComponent {
    constructor(
        private service: CustomerService,
        private router: Router,
        private itemsService: ItemsService,
    ) { this.backUrl = this.router.url; };

    backUrl: string;

    @Input() items: Item[];
    @Input() loading = false;
    @Input() hasError: boolean;
    @Input() getComment: Function;
    @Input() fullItemUrl: string = "../../item";
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @Output() subtotalChanged = new EventEmitter();



    async updateModifiers(item: Item) {
        const { ModifiersModalModal } = await import("./../../../../components/modifiers-modal/modifiers-modal.modal");

        const component = this.modalContainer.createComponent(ModifiersModalModal);

        component.instance.itemId = item.itemObjectId;
        component.instance.sessionItemId = item._id;

        component.instance.leave.subscribe(async (m: any) => {
            if(m) {

                const update: any = await this.service.put({ modifiers: m }, "session/item", item._id, `modifiers?itemId=${item.itemObjectId}`);

                if(update.updated) {
                    this.subtotalChanged.emit(-item.price);
                    item.price = update.newPrice;
                    this.subtotalChanged.emit(item.price)
                }

            }
            component.destroy();
        });

    }
    async itemMore(ev: any, item: Item) {
        
        const popoverPosition = ev.target.getBoundingClientRect(ev.target);

        const { ItemMoreModal } = await import("./../../modals/item-more/item-more.modal");

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
                            this.subtotalChanged.emit(-item.price);
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
                this.router.navigate([this.service.restaurant.id, this.service.locationId, "item", item.itemId], { queryParams: { back: this.router.url } });
            } else if(action == "modifiers") {
                this.updateModifiers(item);
            }

            if(action && action != "more") {
                this.itemsService.$checkoutUpdate.next(true);
            }

            component.destroy();
        });
    }
}
