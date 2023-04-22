import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartEvent, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Item {
    name: string;
    price: number;
    description: number;
    id: string;
    status: string;
    _id: string;
    tags: { title: string; id: string; }[];
    modifiers: {
        name: string;
        required: boolean;
        toSelectTitle: string;   
        amountToSelect: "less" | "more" | "equal" | "one";
        amountOfOptions: number;
        _id: string;

        options: { name: string; price: number; }[];
    }[];
    library: {
        preview: any;
        list: {
            buffer: any;
            resolution: number;
        }[]
    }
}

interface Collection {
    name: string;
    image: any;
    id: string;
    _id: string;
}

@Component({
    selector: 'app-item',
    templateUrl: './item.page.html',
    styleUrls: ['./item.page.scss']
})
export class ItemPage implements OnInit {
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private service: RestaurantService,
    ) {};



    item: Item;
    collections: Collection[];
    image: string;
    loading = false;
    weeks = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    lineChartType: ChartType = 'line';
    averageGrowth: number;

    lineChartData: ChartConfiguration['data'] = {
        datasets: [
        ],
        labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    lineChartOptions: ChartConfiguration['options'] = {
        elements: {
            line: {
                tension: 0.5
            }
        },
        scales: {
            y: {
                position: 'left',
                grid: {
                    display: false,
                }
            },
            y1: {
                display: false,
                position: 'right',
                grid: {
                    color: 'rgba(0,0,0,0.3)',
                },
            },
            x: {
            }
        },

        plugins: {
            legend: { display: false },
        }
    };

    
    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;




    async ngOnInit() {
        const itemId = this.route.snapshot.paramMap.get("itemId");

        if(!itemId) {
            return this.router.navigate([this.service.restaurant.id, "menu", "items"]);
        }
        
        
        const result: { item: Item; collections: Collection[]; sales: { data: number[]; start: number; growth: number; } } = await this.service.get("menu/items", itemId);
        
        this.collections = result.collections;

        this.service.currentDishId = result.item.id;

        
        if(result.item.library && result.item.library.preview) {
            this.image = getImage(result.item.library.preview);
        }

        if(result.collections) {
            this.collections = [];
            for(let collection of result.collections) {
                this.collections.push({ ...collection, image: getImage(collection.image) || "./../../../../../../../../global-resources/images/no-image.svg" })
            }
        }

        this.item = result.item;
        this.averageGrowth = result.sales.growth;

        if(result.sales) {
            this.lineChartData.datasets.push({
                data: result.sales.data,
                label: 'This week',
                borderColor: '#FFC409',
                pointBackgroundColor: "#FFC409",
                pointBorderColor: 'rgba(0, 0, 0, 0)',
                pointHoverBackgroundColor: '#000',
                backgroundColor: "#ffc60933",
                fill: 'origin',
            });

            this.lineChartData.labels = [...this.weeks.slice(result.sales.start + 1), ...this.weeks.slice(0, result.sales.start + 1) ];

            this.chart?.update();
        }

        return;
    }


    async onVisibilityChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.checked;


        const update: any = await this.service.put({ value }, "menu/items", this.item.id, "visibility");

        if(!update.updated) {
            (event.target as HTMLInputElement).checked = !value;
        }
    }
    async addModifier() {
        const { AddModifierModal } = await import("./../../../components/add-modifier/add-modifier.modal");

        const component = this.modalContainer.createComponent(AddModifierModal);

        component.instance.leave.subscribe(async (modifier: any) => {
            if(!modifier) {
                component.destroy();
                return;
            }
            this.loading = true;

            const update: { updated: boolean; modifier: Item["modifiers"][0]; } = await this.service.post({ modifier }, "menu/items", this.item.id, "modifier");

            if(update.updated) {
                this.item.modifiers.push({ ...update.modifier, options: update.modifier.options.map(o => { return { ...o, price: o.price / 100 } }) });
            }

            component.destroy();
            this.loading = false;
        });
    }
    async editModifier(modifier: Item["modifiers"][0]) {
        const { AddModifierModal } = await import("./../../../components/add-modifier/add-modifier.modal");

        const component = this.modalContainer.createComponent(AddModifierModal);

        component.instance.amountOfOptions = modifier.amountOfOptions;
        component.instance.amountToSelect = modifier.amountToSelect;
        component.instance.modifierName = modifier.name;
        component.instance.options = modifier.options;
        component.instance.required = modifier.required;

        component.instance.leave.subscribe(async (updatedModifier: any) => {
            if(!updatedModifier) {
                component.destroy();
                return;
            }
            this.loading = true;

            const update: { updated: boolean; modifier: Item["modifiers"][0]; } = await this.service.put({ modifier: { ...updatedModifier, _id: modifier._id, } }, "menu/items", this.item.id, "modifier");

            if(update.updated) {
                for(let m in this.item.modifiers) {
                    if(modifier._id == this.item.modifiers[m]._id) {
                        this.item.modifiers[m] = update.modifier;
                        break;
                    }
                }
            }

            component.destroy();
            this.loading = false;
        });
    }
    async deleteModifier(id: string) {
        this.loading = true;

        const update: { updated: boolean; } = await this.service.delete("menu/items", this.item.id, "modifier", id);

        if(update.updated) {
            for(const m in this.item.modifiers) {
                if(this.item.modifiers[m]._id == id) {
                    this.item.modifiers.splice(+m, 1);
                    break;
                }
            }
        }

        this.loading = false;
    }
    async editCollections() {
        const { AddCollectionsModal } = await import("../../../components/add-collections/add-collections.modal");

        const component = this.modalContainer.createComponent(AddCollectionsModal);

        // component.instance.selected = this.collections;
        component.instance.ids = this.collections.map(c => c._id);

        component.instance.leave.subscribe(async (collections: Collection[]) => {
            if(collections) {
                this.loading = true;
                const result: any = await this.service.put({ collections: collections.map(c => c._id) }, "menu/items", this.item._id, "collections");

                if(result.updated) {
                    this.collections = collections;
                }
            }
            
            this.loading = false;
            component.destroy();
        });
    }
}
