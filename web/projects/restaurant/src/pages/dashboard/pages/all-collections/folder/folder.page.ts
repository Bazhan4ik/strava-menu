import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Collection {
    name: string;
    id: string;
    _id: string;
    image: any;
    dishes: number;
}
interface Folder {
    name: string;
    id: string;
    _id: string;
    image: string;
    collections: string[];
}

@Component({
    selector: 'app-folder',
    templateUrl: './folder.page.html',
    styleUrls: ['./folder.page.scss']
})
export class FolderPage implements OnInit {

    image: string;
    collections: Collection[];
    folder: Folder;
    loading = false;

    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
        private router: Router,
    ) { };


    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async editCollections() {
        const { AddCollectionsModal } = await import("./../../../components/add-collections/add-collections.modal");

        const component = this.modalContainer.createComponent(AddCollectionsModal);

        component.instance.selected = this.collections;

        component.instance.leave.subscribe(async (collections: Collection[]) => {
            if(collections) {
                this.loading = true;

                const update: any = await this.service.put({ collections: collections.map(c => c._id ) }, "menu/folders", this.folder.id, "collections");

                if(update.updated) {
                    this.collections = collections.map(c => { return { ...c, dishes: typeof c.dishes == "number" ? c.dishes : (c.dishes as any).length }});
                }

                this.loading = false;
            }

            component.destroy();
        });
    }

    async remove() {
        this.loading = true;
        const update: any = await this.service.delete("menu/folders", this.folder.id);

        if(update.updated) {
            this.router.navigate([this.service.restaurant.id, "menu", "collections"]);
        }


        this.loading = false;
    }

    async ngOnInit() {
        const folderId = this.route.snapshot.paramMap.get("folderId");

        if(!folderId) {
            this.router.navigate([this.service.restaurant.id, "menu", "collections"], { replaceUrl: true });
            return;
        }

        const result: any = await this.service.get("menu/folders", folderId);

        this.folder = result.folder;
        this.image = getImage(this.folder.image) || "./../../../../../../../../global-resources/images/no-image.svg";
        
        this.collections = [];
        for(const collection of result.collections) {
            this.collections.push({
                ...collection,
                image: getImage(collection.image) || "./../../../../../../../../global-resources/images/no-image.svg",
            });
        }


        console.log(result);



    }

}
