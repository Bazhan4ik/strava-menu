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

    loading = false;

    folders: Folder[];
    
    newSelected: Collection[] = [];
    
    constructor(
        private service: RestaurantService,
    ) {};
        
    @Input() ids: string[] = [];
    @Input() one: boolean = false;
    @Output() leave = new EventEmitter();


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

            console.log("ON CHANGE FUN");

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
        console.log(this.newSelected);
        this.leave.emit(this.newSelected);
    }


    async ngOnInit() {
        const result: Folder[] = await this.service.get("menu/collections");

        this.folders = [];

        for(let folder of result) {
            const index = this.folders.push({
                ...folder,
                collections: [],
                image: getImage(folder.image) || "./../../../../../../../../../global-resources/images/no-image.svg",
            });
            for(const collection of folder.collections) {
                const c = { ...collection, open: false, image: getImage(collection.image) || "./../../../../../../../../../global-resources/images/no-image.svg" };

                this.folders[index - 1].collections.push(c);

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
    }

}
