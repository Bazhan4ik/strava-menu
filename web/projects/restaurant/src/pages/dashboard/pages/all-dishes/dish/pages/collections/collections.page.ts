import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Collection {
    name: string;
    image: string;
    id: string;
    _id: string;
}

@Component({
    selector: 'app-collections',
    templateUrl: './collections.page.html',
    styleUrls: ['./collections.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
    ]
})
export class CollectionsPage implements OnInit {
    collections: Collection[];

    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
    ) {};

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    async edit() {
        const { AddCollectionsModal } = await import("./../../../shared-components/add-collections/add-collections.modal");

        const component = this.modalContainer.createComponent(AddCollectionsModal);

        component.instance.selected = this.collections || [];

        component.instance.leave.subscribe(async (collections: Collection[]) => {

            if(collections) {
                this.collections = collections;
            }

            component.destroy();
        });
    }

    async ngOnInit() {

        const result: Collection[] = await this.service.get("menu/dishes", this.service.currentDishId!, "collections");

        this.collections = [];

        for(const collection of result) {
            this.collections.push({
                name: collection.name,
                id: collection.id,
                _id: collection._id,
                image: getImage(collection.image),
            });
        }

        console.log(result);
    }
}
