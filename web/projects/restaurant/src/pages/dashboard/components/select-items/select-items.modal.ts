import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Item {
    name: string;
    id: string;
    image: string;
    _id: string;
}

@Component({
    selector: 'app-select-items',
    templateUrl: './select-items.modal.html',
    styleUrls: ['./select-items.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class SelectItemsModal implements OnInit {

    items: Item[];
    newSelected: Item[] = [];
    
    constructor(
        private service: RestaurantService,
        ) { };

        
    @Input() ids: string[] = [];
    @Input() selected: Item[] = [];
    @Input() one = false;
    @Output() leave = new EventEmitter();




    onChange(ev: any, item: Item) {
        if(ev.target.checked) {
            this.newSelected.push(item);
            this.ids.push(item._id);

            if(this.one) {
                this.ids = [item._id];
                for(let i in this.newSelected) {
                    if(this.newSelected[i]._id == item._id) {
                        continue;
                    }
                    this.newSelected.splice(+i, 1);
                }
            }

        } else {
            for(let i in this.newSelected) {
                if(this.newSelected[i]._id == item._id) {
                    this.newSelected.splice(+i, 1);
                    break;
                }
            }
        }
    }

    save() {
        this.leave.emit(this.newSelected || []);
    }
    close() {
        this.leave.emit();
    }


    async ngOnInit() {
        const result: Item[] = await this.service.get("menu/collections/items-to-select");

        this.items = [];

        for(let item of result) {
            this.items.push({
                name: item.name,
                image: getImage(item.image) || "./../../../../../../../../../global-resources/images/no-image.svg",
                id: item.id,
                _id: item._id,
            });
        }

        if(this.ids.length > 0 && this.selected.length == 0) {
            for(const item of this.items) {
                for(const id of this.ids) {
                    if(item._id == id) {
                        this.selected.push(item);
                        break;
                    }
                }
            }
        }

        for(let item of this.selected) {
            this.newSelected.push(item);
            this.ids.push(item._id);
        }

    }

}
