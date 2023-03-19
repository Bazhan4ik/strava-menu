import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter, ViewContainerRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

@Component({
    selector: 'app-sorting',
    templateUrl: './sorting.modal.html',
    styleUrls: ['./sorting.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class SortingModal implements OnInit {
    constructor(
        private service: RestaurantService,
    ) { };

    collections: { image: any; _id: string; name: string; }[];
    items: { image: any; _id: string; name: string; }[]
    
    @Input() title: string;
    @Input() day?: number;
    @Input() time?: string;
    @Output() leave = new EventEmitter();
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    close() {
        this.leave.emit();
    }


    async editItems() {
        const { SelectItemsModal } = await import("./../../../components/select-items/select-items.modal");

        const component = this.modalContainer.createComponent(SelectItemsModal);


        component.instance.ids = this.items.map(item => item._id);


        component.instance.leave.subscribe(async (newItems: { _id: string; name: string; image: any; }[]) => {

            if(newItems) {
                this.items = newItems;

                let update: any;

                if(typeof this.day == "number") {
                    update = await this.service.put({ items: newItems.map(item => item._id) }, `menu/sorting/day/items?day=${this.day}`);
                } else if(this.time) {
                    update = await this.service.put({ items: newItems.map(item => item._id) }, `menu/sorting/time/items?time=${this.time}`);
                }


                if(!update.updated) {
                    this.close();
                }
            }


            component.destroy();
        });
    }
    async removeItem(index: number) {
        const item = this.items[index];
        this.items.splice(index, 1);

        let update: any;
        if(typeof this.day == "number") {
            update = await this.service.put({ itemId: item._id }, `menu/sorting/day/items/remove?day=${this.day}`);
        } else if(this.time) {
            update = await this.service.put({ itemId: item._id }, `menu/sorting/time/items/remove?time=${this.time}`);
        }


        if(!update.updated) {
            this.items.splice(index, 0, item);
        }
    }
    

    async editCollections() {
        const { AddCollectionsModal } = await import("./../../../components/add-collections/add-collections.modal");

        const component = this.modalContainer.createComponent(AddCollectionsModal);


        component.instance.ids = this.collections.map(collection => collection._id);


        component.instance.leave.subscribe(async (newCollections: { _id: string; name: string; image: any; }[]) => {

            if(newCollections) {
                this.collections = newCollections;


                let update: any;
                if(typeof this.day == "number") {
                    update = await this.service.put({ collections: newCollections.map(collection => collection._id) }, `menu/sorting/day/collections?day=${this.day}`);
                } else if(this.time) {
                    update = await this.service.put({ collections: newCollections.map(collection => collection._id) }, `menu/sorting/time/collections?time=${this.time}`);
                }

                if(!update.updated) {
                    this.close();
                }
            }


            component.destroy();
        });
    }
    async removeCollection(index: number) {
        const collection = this.collections[index];
        this.collections.splice(index, 1);

        let update: any;
        if(typeof this.day == "number") {
            update = await this.service.put({ collectionId: collection._id }, `menu/sorting/day/collections/remove?day=${this.day}`);
        } else if(this.time) {
            update = await this.service.put({ collectionId: collection._id }, `menu/sorting/time/collections/remove?time=${this.time}`);
        }


        if(!update.updated) {
            this.collections.splice(index, 0, collection);
        }
    }


    async ngOnInit() {
        let result: any;
        if(typeof this.day == "number") {
            result = await this.service.get(`menu/sorting/day?day=${this.day}`);
        } else if(this.time) {
            result = await this.service.get(`menu/sorting/time?time=${this.time}`);
        }

        this.items = [];
        for(const item of result.items) {
            this.items.push({ ...item, image: getImage(item.image) || "./../../../../../../../../global-resources/images/no-image.svg" });
        }
        
        this.collections = [];
        for(const collection of result.collections) {
            this.collections.push({ ...collection, image: getImage(collection.image) || "./../../../../../../../../global-resources/images/no-image.svg" });
        }
    }
}
