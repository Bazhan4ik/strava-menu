import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Collection {
    name: string;
    image: any;
    _id: string;
}

@Component({
    selector: 'app-add-collections',
    templateUrl: './add-collections.modal.html',
    styleUrls: ['./add-collections.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule]
})
export class AddCollectionsModal implements OnInit {

    loading = false;

    collections: Collection[];
    ids: string[] = [];

    newSelected: Collection[] = [];

    constructor(
        private service: RestaurantService,
    ) {}

    @Input() selected: Collection[];
    @Output() leave = new EventEmitter();


    close() {
        this.leave.emit();
    }

    onChange(ev: any, collection: Collection) {
        if(ev.target.checked) {
            this.newSelected.push(collection);
            this.ids.push(collection._id);
        } else {
            for(let i in this.newSelected) {
                if(this.newSelected[i]._id == collection._id) {
                    this.newSelected.splice(+i, 1);
                    break;
                }
            }
        }
    }

    async save() {
        this.loading = true;

        const result: any = await this.service.put({ collections: this.newSelected.map(c => c._id) }, "menu/dishes", this.service.currentDishId, "collections");

        if(result.updated) {
            this.leave.emit(this.newSelected);
        }
        this.loading = false;
    }


    async ngOnInit() {
        const result: Collection[] = await this.service.get("menu/collections");

        console.log(result);

        this.collections = [];

        for(let collection of this.selected) {
            this.ids.push(collection._id);
            this.newSelected.push(collection);
        }

        for(let c of result) {
            this.collections.push({
                ...c,
                image: getImage(c.image) || "./../../../../../../../../../global-resources/images/no-image.svg",
            });
        }

        console.log(result);
    }

}
