import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';

interface Dish {
    name: string;
    id: string;
    image: string;
    _id: string;
}

@Component({
    selector: 'app-select-dishes',
    templateUrl: './select-dishes.modal.html',
    styleUrls: ['./select-dishes.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class SelectDishesModal implements OnInit {

    dishes: Dish[] = [];

    
    newSelected: Dish[] = [];
    
    constructor(
        private service: RestaurantService,
        ) { };

        
    @Input() ids: string[] = [];
    @Input() selected: Dish[] = [];
    @Input() one = false;
    @Output() leave = new EventEmitter();




    onChange(ev: any, dish: Dish) {
        if(ev.target.checked) {
            this.newSelected.push(dish);
            this.ids.push(dish._id);

            if(this.one) {
                this.ids = [dish._id];
                for(let i in this.newSelected) {
                    if(this.newSelected[i]._id == dish._id) {
                        continue;
                    }
                    this.newSelected.splice(+i, 1);
                }
            }

        } else {
            for(let i in this.newSelected) {
                if(this.newSelected[i]._id == dish._id) {
                    this.newSelected.splice(+i, 1);
                    break;
                }
            }
        }
    }

    save() {
        this.leave.emit(this.newSelected || []);
    }
    close() {
        this.leave.emit();
    }


    async ngOnInit() {
        const result: Dish[] = await this.service.get("menu/collections/dishes-to-select");


        for(let dish of result) {
            this.dishes.push({
                name: dish.name,
                image: getImage(dish.image) || "./../../../../../../../../../global-resources/images/no-image.svg",
                id: dish.id,
                _id: dish._id,
            });
        }

        for(let dish of this.selected) {
            this.newSelected.push(dish);
            this.ids.push(dish._id);
        }

    }

}
