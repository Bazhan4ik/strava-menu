import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ViewContainerRef, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { ItemsService } from 'projects/customer/src/services/items.service';
import { CollectionComponent } from '../../components/collection/collection.component';
import { ItemLayoutElementComponent } from '../../components/item-layout-element/item-layout-element.component';
import { MiniTrackingComponent } from '../../components/mini-tracking/mini-tracking.component';
import { Collection } from '../../models/collection';
import { Item } from '../../models/item';
import { IonicModule, NavController } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';


interface Response {
    tracking?: any[];
    items: { [itemObjectId: string]: Item };
    elements: {
        type: "collection" | "folder" | "item";
        data: Item | Collection | {
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
    imports: [CommonModule, CollectionComponent, MatIconModule, IonicModule, MiniTrackingComponent, RouterModule],
})
export class RecommendationsPage implements OnInit {
    constructor(
        private service: CustomerService,
        private itemsService: ItemsService,
    ) { };


    tracking: any;
    elements: Response["elements"];
    restaurant: any;
    position: number;

    previewShown = false;

    @ViewChild("body", { read: ViewContainerRef }) body: ViewContainerRef;
    @ViewChild("previewContainer", { read: ViewContainerRef }) previewContainer: ViewContainerRef;

    @HostListener('window:resize', ['$event']) onResize() {
        if(window.innerWidth > 1200) {
            if(!this.previewShown) {
                this.showPreview();
            }
        } else {
            this.hidePreview();
        }
    }


    async ngOnInit() {
        const result: Response = await this.service.get({ }, "recommendations");

        this.elements = result.elements;
        this.itemsService.items = result.items;
        this.tracking = result.tracking;

        this.restaurant = this.service.restaurant;

        this.updateLayout();

        if(window.innerWidth > 1200) {
            this.showPreview();
        }
    }


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
            } else if(element.type == "item") {
                const component = this.body.createComponent(ItemLayoutElementComponent);

                component.instance.item = element.data as Item;
            }
        }
    }
    openPreview() {

    }
    async showPreview() {
        const { PreviewPage } = await import("./../preview/preview.page");

        const component = this.previewContainer.createComponent(PreviewPage);

        this.previewShown = true;

        component.instance.mini = true;
    }
    async hidePreview() {
        this.previewShown = false;
        this.previewContainer.clear();
    }
}
