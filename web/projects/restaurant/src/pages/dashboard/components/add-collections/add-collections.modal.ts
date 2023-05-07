import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { env } from 'environment/environment';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

interface Collection {
    name: string;
    image: any;
    _id: string;
    hasImage: boolean;
    id: string;
}

interface Folder {
    name: string;
    id: string;
    image: any;
    open: boolean;
    collections: Collection[];
}


@Component({
    selector: 'app-add-collections',
    templateUrl: './add-collections.modal.html',
    styleUrls: ['./add-collections.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule]
})
export class AddCollectionsModal implements OnInit {
    constructor(
        private service: RestaurantService,
    ) {};


    loading = false;
    dayTimes: Folder = { collections: [], id: "", name: "Times of day", open: false, image: "" };
    itemTypes: Folder = { collections: [], id: "", name: "Types of items", open: false, image: "" };
    collections: Collection[] = [];
    folders = [this.dayTimes, this.itemTypes];
    newSelected: Collection[] = [];
    
        
    @Input() ids: string[] = [];
    @Input() one: boolean = false;
    @Output() leave = new EventEmitter();


    async ngOnInit() {
        const result: Collection[] = await this.service.get("menu/collections");

        for(let c of result) {
            const collection = {
                ...c,
                image: c.hasImage ? `${env.apiUrl}/restaurants/${this.service.restaurant._id}/menu/collections/${c.id}/image` : "./../../../../../../../../../../global-resources/images/no-image.svg"
            };
            if([
                "appetizers",
                "entrees",
                "beverages",
                "desserts",
                "sides",
                "soups",
                "salads",
            ].includes(collection.id)) {
                this.itemTypes.collections.push(collection);
            } else if([
                "breakfast",
                "brunch",
                "late-night",
                "lunch",
                "dinner",
            ].includes(collection.id)) {
                this.dayTimes.collections.push(collection);
            } else {
                this.collections.push(collection);
            }

            for(const id of this.ids) {
                if(collection._id == id) {
                    let add = true;
                    for(const c of this.newSelected) {
                        if(c._id == id) {
                            add = false;
                            break;
                        }
                    }
                    if(add) {
                        this.newSelected.push(c);
                    }
                    break;
                }
            }
        }
    }


    close() {
        this.leave.emit();
    }
    onChange(ev: any, collection: Collection) {
        if(ev.target.checked) {
            if(this.one) {
                this.newSelected = [collection];
                this.ids = [collection._id];
                return;
            }

            for(const id of this.ids) {
                if(collection._id == id) {
                    return;
                }
            }
            
            this.newSelected.push(collection);
            this.ids.push(collection._id);
        } else {
            for(let i in this.newSelected) {
                if(this.newSelected[i]._id == collection._id) {
                    this.newSelected.splice(+i, 1);
                    break;
                }
            }
            for(let i in this.ids) {
                if(this.ids[i] == collection._id) {
                    this.ids.splice(+i, 1);
                }
            }
        }
    }
    async save() {
        if(this.one && this.newSelected.length == 0) {
            return;
        }
        this.leave.emit(this.newSelected);
    }
}
