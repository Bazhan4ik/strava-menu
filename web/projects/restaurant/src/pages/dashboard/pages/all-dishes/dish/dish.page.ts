import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartEvent, ChartType } from 'chart.js';
// import { default as Annotation } from 'chartjs-plugin-annotation';
import { BaseChartDirective } from 'ng2-charts';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Dish {
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
    selector: 'app-dish',
    templateUrl: './dish.page.html',
    styleUrls: ['./dish.page.scss']
})
export class DishPage implements OnInit {

    dish: Dish;
    collections: Collection[];

    image: string;
    loading = false;

    weeks = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    lineChartType: ChartType = 'line';

    averageGrowth: number;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private service: RestaurantService,
    ) {};


    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;




    async onVisibilityChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.checked;


        const update: any = await this.service.put({ value }, "menu/dishes", this.dish.id, "visibility");

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

            const update: { updated: boolean; modifier: Dish["modifiers"][0]; } = await this.service.post({ modifier }, "menu/dishes", this.dish.id, "modifier");

            if(update.updated) {
                this.dish.modifiers.push(update.modifier);
            }

            component.destroy();
            this.loading = false;
        });
    }
    async editModifier(modifier: Dish["modifiers"][0]) {
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

            const update: { updated: boolean; modifier: Dish["modifiers"][0]; } = await this.service.put({ modifier: { ...updatedModifier, _id: modifier._id, } }, "menu/dishes", this.dish.id, "modifier");

            if(update.updated) {
                for(let m in this.dish.modifiers) {
                    if(modifier._id == this.dish.modifiers[m]._id) {
                        this.dish.modifiers[m] = update.modifier;
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

        const update: { updated: boolean; } = await this.service.delete("menu/dishes", this.dish.id, "modifier", id);

        if(update.updated) {
            for(const m in this.dish.modifiers) {
                if(this.dish.modifiers[m]._id == id) {
                    this.dish.modifiers.splice(+m, 1);
                    break;
                }
            }
        }

        this.loading = false;
    }


    async editCollections() {
        const { AddCollectionsModal } = await import("../../../components/add-collections/add-collections.modal");

        const component = this.modalContainer.createComponent(AddCollectionsModal);

        component.instance.selected = this.collections;

        component.instance.leave.subscribe(async (collections: Collection[]) => {
            if(collections) {
                this.loading = true;
                const result: any = await this.service.put({ collections: collections.map(c => c._id) }, "menu/dishes", this.dish._id, "collections");

                if(result.updated) {
                    this.collections = collections;
                }
            }
            
            this.loading = false;
            component.destroy();
        });
    }




    async ngOnInit() {
        const dishId = this.route.snapshot.paramMap.get("dishId");

        
        if(!dishId) {
            return this.router.navigate([this.service.restaurant.id, "menu/dishes"]);
        }
        
        
        const result: { dish: Dish; collections: Collection[]; sales: { data: number[]; start: number; growth: number; } } = await this.service.get("menu/dishes", dishId);
        
        this.collections = result.collections;

        this.service.currentDishId = result.dish.id;

        
        if(result.dish.library && result.dish.library.preview) {
            this.image = getImage(result.dish.library.preview);
        }

        if(result.collections) {
            this.collections = [];
            for(let collection of result.collections) {
                this.collections.push({ ...collection, image: getImage(collection.image) || "./../../../../../../../../global-resources/images/no-image.svg" })
            }
        }

        this.dish = result.dish;
        this.averageGrowth = result.sales.growth;

        console.log(result);

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
}
