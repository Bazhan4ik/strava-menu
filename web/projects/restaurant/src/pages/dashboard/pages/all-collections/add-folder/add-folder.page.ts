import { Component, ViewContainerRef, ViewChild, } from '@angular/core';
import { Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

@Component({
    selector: 'app-add-folder',
    templateUrl: './add-folder.page.html',
    styleUrls: ['./add-folder.page.scss']
})
export class AddFolderPage {

    name: string;
    loading: boolean;
    collections: any[] = [];

    constructor(
        private service: RestaurantService,
        private router: Router,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    removeCollection(id: string) {
        for(let i in this.collections) {
            if(this.collections[i].id == id) {
                this.collections.splice(+i, 1);
                break;
            }
        }
    }

    async editCollections() {
        const { AddCollectionsModal } = await import("../../../components/add-collections/add-collections.modal");

        const component = this.modalContainer.createComponent(AddCollectionsModal);

        // component.instance.selected = this.collections;
        component.instance.ids = this.collections.map(c => c._id);


        component.instance.leave.subscribe((collections: any) => {
            if(collections) {

                this.collections = collections;

            }

            component.destroy();
        });

    }


    async save() {
        this.loading = true;

        const result: any = await this.service.post({ name: this.name, collections: this.collections.map(c => c._id) }, "menu/folders");


        if(result.updated) {
            this.router.navigate([this.service.restaurant.id, "menu", "collections"], { replaceUrl: true });
        } else {
            this.loading = false;
        }

    }



}
