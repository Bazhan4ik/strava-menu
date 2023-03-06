import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewContainerRef, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishesService } from 'projects/customer/src/services/dishes.service';
import { CollectionComponent } from '../../components/collection/collection.component';
import { MiniTrackingComponent } from '../../components/mini-tracking/mini-tracking.component';
import { Collection } from '../../models/collection';
import { Dish } from '../../models/dish';


interface Response {
    tracking?: any[];
    dishes: { [dishObjectId: string]: Dish };
    elements: {
        type: "collection" | "folder";
        data: Collection | {
            name: string;
            collections: {
                name: string;
                id: string;
                _id: string;
                image: string;
            }[];
        }
    }[];
}


@Component({
    selector: 'app-recommendations',
    templateUrl: './recommendations.page.html',
    styleUrls: ['./recommendations.page.scss'],
    standalone: true,
    imports: [CommonModule, CollectionComponent, MatIconModule, MiniTrackingComponent],
})
export class RecommendationsPage implements OnInit {
    tracking: any;
    elements: Response["elements"];

    position: number;

    constructor(
        private service: CustomerService,
        private dishesService: DishesService,
    ) { };


    @ViewChild("body", { read: ViewContainerRef }) body: ViewContainerRef;


    async updateLayout() {
        const { CollectionComponent } = await import("./../../components/collection/collection.component");
        const { FolderComponent } = await import("./../../components/folder/folder.component");
        
        for(const element of this.elements) {
            if(element.type == "collection") {

                const component = this.body.createComponent(CollectionComponent);

                component.instance.collection = element.data as Collection;
            } else if(element.type == "folder") {
                const component = this.body.createComponent(FolderComponent);

                component.instance.folder = element.data as any;
            }
        }
    }


    async ngOnInit() {
        const result: Response = await this.service.get({ }, "recommendations");

        console.log(result);

        this.elements = result.elements;
        this.dishesService.dishes = result.dishes;
        this.tracking = result.tracking;

        this.updateLayout();
    }
}
