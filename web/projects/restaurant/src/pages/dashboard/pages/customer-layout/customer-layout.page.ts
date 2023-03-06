import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { CollectionComponent } from './components/collection/collection.component';
import { FolderComponent } from './components/folder/folder.component';


interface LayoutElement {
    _id: string;
    name: string;
    type: string;
    position: number;
    data: {
        id: string;
        collection?: {
            id: string;
            name: string;
            _id: string;
            dishes: { name: string; price: number; id: string; _id: string; }[];
        }
        folder?: {
            name: string;
            id: string;
            _id: string;
            collections: {
                name: string;
                id: string;
                _id: string;
                dishes: string[];
            }[];
        }
    };
}


@Component({
    selector: 'app-customer-layout',
    templateUrl: './customer-layout.page.html',
    styleUrls: ['./customer-layout.page.scss']
})
export class CustomerLayoutPage implements OnInit {

    elements: LayoutElement[];
    loading = false;

    components: any[] = [];

    constructor(
        private service: RestaurantService,
        private changeDetector: ChangeDetectorRef,
    ) {}


    @ViewChild("phone", { read: ViewContainerRef }) phone: ViewContainerRef;
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async updateLayout() {
        this.components = [];

        this.phone.clear();

        const [{ FolderComponent }, { CollectionComponent }] = await Promise.all([
            import("./components/folder/folder.component"),
            import("./components/collection/collection.component")
        ]);

        for(const [index, element] of this.elements.entries()) {

            if(!element.data?.folder && !element.data?.collection) {
                continue;
            }

            element.position = index + 1;

            const component = this.phone.createComponent(element.type == "collection" ? CollectionComponent : FolderComponent as any);

            if(element.type == "collection") {
                ((component.instance as unknown) as CollectionComponent).collection = element.data.collection!;
            } else if(element.type == "folder") {
                (component.instance as FolderComponent).folder = element.data.folder!;
            }

            this.components.push(component);
        }

    }

    async selectCollection(element: LayoutElement) {
        const { AddCollectionsModal } = await import("./../../components/add-collections/add-collections.modal");

        const component = this.modalContainer.createComponent(AddCollectionsModal);

        component.instance.selected = [{ _id: element.data?.id, name: null!, image: null! }];
        component.instance.one = true;


        component.instance.leave.subscribe(async (collections: any) => {
            if(collections) {
                const collection = collections[0];

                this.loading = true;

                const update: any = await this.service.put({ collectionId: collection._id, elementId: element._id }, "layout", "collection");

                if(update.updated) {
                    if(element.data) {
                        element.data.collection = update.collection;
                    } else {
                        element.data = { id: update.collection._id, collection: update.collection};
                    }
                    this.updateLayout();
                }
            }

            this.loading = false;
            component.destroy();
        });
    }
    async selectFolder(element: LayoutElement) {
        const { AddFolderModal } = await import("./../../components/add-folder/add-folder.modal");

        const component = this.modalContainer.createComponent(AddFolderModal);

        component.instance.selected = [{ _id: element.data?.id, name: null!, collections: null!, }];
        component.instance.one = true;


        component.instance.leave.subscribe(async (folders: any) => {
            if(folders) {
                const folder = folders[0];

                this.loading = true;

                const update: any = await this.service.put({ folderId: folder._id, elementId: element._id }, "layout", "folder");

                if(update.updated) {
                    if(element.data) {
                        element.data.folder = update.folder;
                    } else {
                        element.data = { id: update.folder._id, folder: update.folder};
                    }
                    this.updateLayout();
                }
            }

            this.loading = false;
            component.destroy();
        });
    }

    editElement(element: LayoutElement) {
        if(element.type == "collection") {
            this.selectCollection(element);
        } else if(element.type == "folder") {
            this.selectFolder(element);
        }
    }
    async deleteElement(element: LayoutElement) {
        this.loading = true;

        const result: any = await this.service.delete("layout", element._id);

        if(result.updated) {
            for(const e in this.elements) {
                if(this.elements[e]._id == element._id) {
                    this.elements.splice(+e, 1);
                    break;
                }
            }

            this.updateLayout();
        }

        this.loading = false;
    }

    async moveUp(index: number) {
        if(index == 0) {
            return;
        }

        const el = this.elements[index];

        el.position--;
        this.elements[index].position++;

        // Remove the element from its current position
        this.elements.splice(index, 1);
        
        // Insert the element one position closer to the start of the array
        this.elements.splice(index - 1, 0, el);

        this.updateLayout();

        const update: any = await this.service.put({ elementId: el._id, index: index - 1, move: 1 }, "layout/position");
    }
    async moveDown(index: number) {
        if(index == this.elements.length - 1) {
            return;
        }

        const element = this.elements[index];

        element.position++;
        this.elements[index].position--;

        // Remove the element from its current position
        this.elements.splice(index, 1);

        // Insert the element one position closer to the end of the array
        this.elements.splice(index + 1, 0, element);

        this.updateLayout();

        const update: any = await this.service.put({ elementId: element._id, index: index + 1, move: -1 }, "layout/position");
    }


    async addElement() {
        const { AddElementModal } = await import("./components/add-element/add-element.modal");

        const component = this.modalContainer.createComponent(AddElementModal);

        component.instance.leave.subscribe(async (type: string) => {

            if(type) {
                this.loading = true;
                const result: { updated: boolean; element: LayoutElement; } = await this.service.post({ type }, "layout");

                if(result.updated) {
                    this.elements.push(result.element);
                    this.updateLayout();

                }
            }
            
            this.loading = false;
            component.destroy();
        });

    }


    async ngOnInit() {

        const result: { layout: LayoutElement[]; } = await this.service.get("layout");

        this.elements = result.layout;
        console.log(result);

        this.updateLayout();

    }
}
