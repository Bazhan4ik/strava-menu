import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Collection {
    name: string;
    id: string;
    image: any;
}

interface Folder {
    name: string;
    id: string;
    image: any;
    open: boolean;
    collections: Collection[];
}

@Component({
  selector: 'app-collections',
  templateUrl: './collections.page.html',
  styleUrls: ['./collections.page.scss']
})
export class CollectionsPage implements OnInit {


    folders: Folder[];


    constructor(
        private service: RestaurantService,
    ) {}



    async ngOnInit() {
        const result: Folder[] = await this.service.get("menu/collections");

        if(result) {
            this.folders = [];
            for(let folder of result) {
                    this.folders.push({
                    ...folder,
                    collections: folder.collections.map(c => { return { ...c, open: false, image: getImage(c.image) || "./../../../../../../../../../../global-resources/images/no-image.svg" } }),
                    image: getImage(folder.image) || "./../../../../../../../../../../global-resources/images/no-image.svg",
                });
            }
        }


        console.log(result);
    }
}
