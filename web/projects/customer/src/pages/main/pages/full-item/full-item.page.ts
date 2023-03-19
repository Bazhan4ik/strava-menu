import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, ViewChild, ChangeDetectorRef, ViewContainerRef, AfterViewInit, ComponentRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { ItemsService } from 'projects/customer/src/services/items.service';
import { Subscription } from 'rxjs';
import { CollectionComponent } from '../../components/collection/collection.component';
import { ModifiersComponent } from '../../components/modifiers/modifiers.component';
import { Item } from '../../models/item';

@Component({
    selector: 'app-full-item',
    templateUrl: './full-item.page.html',
    styleUrls: ['./full-item.page.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, CollectionComponent, NgOptimizedImage],
})
export class FullItemPage implements OnInit, OnDestroy, AfterViewInit {

    image: string;
    imageUrl: string;
    item: Item;
    amount: number = 0;
    backUrl: string;
    collection: any;
    subscription: Subscription;
    modifiers: ComponentRef<ModifiersComponent>;

    adding = {
        loading: false,
        added: false,
    }
    removing = {
        loading: false,
        removed: false,
    }

    constructor(
        private service: CustomerService,
        private router: Router,
        private route: ActivatedRoute,
        private injector: Injector,
        private itemsService: ItemsService,
        private changeDetector: ChangeDetectorRef,
    ) {
        this.subscription = this.router.events.subscribe(ev => {
            if(ev instanceof NavigationEnd) {
                if(this.item) {
                    const itemId = ev.url.split("?")[0].split("/")[3];
    
                    if(this.item.id != itemId) {
                        this.amount = 0;
                        this.item = null!;
                        this.collection = null!;
                        this.ngOnInit();
                    }
                }
            }
        });
    };

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @ViewChild("modifiersContainer", { read: ViewContainerRef }) modifiersContainer: ViewContainerRef;


    async remove() {
        this.removing.loading = true;
        this.removing.removed = false;
        let item: any = null!;
        let index: string = null!;
        for(const d in this.service.session.items) {
            if(this.service.session.items[d].itemId == this.item._id) {
                item = this.service.session.items[d];
                index = d;
                break;
            }
        }

        if(!item) {
            this.removing.loading = false;
            return;
        }

        const result: { updated: boolean; } = await this.service.delete("session", "item", item._id);

        if(result.updated) {
            this.amount--;
            
            this.service.session.items.splice(+index, 1);
            
            this.removing.loading = false;
            this.removing.removed = true;

            setTimeout(() => {
                this.removing.removed = false;
            }, 1000);
        }
    }
    async add(comment: string = null!) {
        this.adding.loading = true;
        this.adding.added = false;

        const modifiers = this.modifiers.instance.getModifiers();

        if(!modifiers) {
            this.adding.added = false;
            this.adding.loading = false;
            return;
        }

        this.amount++;

        const result: { insertedId: string; } = await this.service.post({ comment, modifiers, itemId: this.item._id }, "session", "item");

        if(result.insertedId) {    
            this.service.session.items.push({
                _id: result.insertedId,
                itemId: this.item._id,
                comment: comment,
            });

            this.adding.loading = false;
            this.adding.added = true;

            setTimeout(() => {
                this.adding.added = false;
            }, 1000);
        } else {
            this.amount--;
        }

    }
    
    async comment() {
        const { CommentModal } = await import("../../components/comment/comment.modal");
        
        const component = this.modalContainer.createComponent(CommentModal, { injector: this.injector,  });
     
        
        component.instance.leave.subscribe((comment: string) => {
            if(comment) {
                this.add(comment);
            }
            component.destroy();
        });
    }


    reloadModifications() {
        this.changeDetector.detectChanges();

        this.modifiers = this.modifiersContainer.createComponent(ModifiersComponent);

        this.modifiers.instance.modifiers = this.item.modifiers;
    }


    async ngAfterViewInit() {
        
    }
    async ngOnInit() {

        const itemId = this.route.snapshot.paramMap.get("itemId");
        const backUrl = this.route.snapshot.queryParamMap.get("back");
        const collectionId = this.route.snapshot.queryParamMap.get("c"); // collection id where the item was redirected from. used to show more items from that collection

        this.imageUrl = env.apiUrl + "/customer/" + this.service.restaurant._id + "/items/" + itemId + "/image";

        if(backUrl) {
            this.backUrl = backUrl!;
        } else {
            this.backUrl = `/${this.service.restaurant.id}/${this.service.locationId}/home`;
        }

        if(!itemId) {
            return this.router.navigate([this.service.restaurant.id, "recommendations"]);
        }

        if(this.itemsService.items) {
            for(let id of Object.keys(this.itemsService.items)) {
                if(this.itemsService.items[id].id == itemId) {
                    this.item = this.itemsService.items[id];
                    break;
                }
            }
        }

        
        try {
            const result: {
                item: Item;
            } = await this.service.get({ collection: collectionId || undefined!, }, "items", itemId);
            
            this.item = result.item;

            this.reloadModifications();
            
            for(let i of this.service.session.items) {
                if(i.itemId == this.item._id) {
                    this.amount++;
                }
            }
        } catch (e: any) {
            if(e.status == 404) {
                this.router.navigate([this.service.restaurant.id, this.service.locationId, "home"], { replaceUrl: true });
            }
        }
        return;
    }
    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}
