import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';



interface Folder {
    name: string;
    collections: number;
    _id: string;
}

@Component({
    selector: 'app-add-folder',
    templateUrl: './add-folder.modal.html',
    styleUrls: ['./add-folder.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class AddFolderModal implements OnInit {
    loading = false;

    newSelected: Folder[];
    folders: Folder[];
    ids: string[];

    constructor(
        private service: RestaurantService,
    ) {};


    @Input() selected: Folder[];
    @Input() one = false;
    @Output() leave = new EventEmitter();


    onChange(ev: any, folder: Folder) {
        if(ev.target.checked) {
            if(this.one) {
                this.newSelected = [folder];
                this.ids = [folder._id];
                return;
            }
            this.newSelected.push(folder);
            this.ids.push(folder._id);
        } else {
            for(let i in this.newSelected) {
                if(this.newSelected[i]._id == folder._id) {
                    this.newSelected.splice(+i, 1);
                    break;
                }
            }
            for(let i in this.ids) {
                if(this.ids[i] == folder._id) {
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
    close() {
        this.leave.emit();
    }


    async ngOnInit() {

        
        const result: Folder[] = await this.service.get("menu/folders");
        
        this.newSelected = [];
        this.ids = [];
        
        for(let folder of this.selected) {
            this.ids.push(folder._id);
            this.newSelected.push(folder);
        }

        this.folders = result;


        console.log(result);

    }
}
