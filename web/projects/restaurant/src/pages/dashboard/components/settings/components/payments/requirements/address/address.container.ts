import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

@Component({
    selector: 'app-address',
    templateUrl: './address.container.html',
    styleUrls: ['./address.container.scss'],
})
export class AddressContainer {

    selected: any;

    loading = false;

    constructor(
        private service: RestaurantService,
    ) {};

    @Input() locations: any[];
    @Output() leave = new EventEmitter();


    select(location: any) {
        this.selected = location;
    }

    save() {
        if(!this.selected) {
            return;
        }

        this.loading = true;


        this.leave.emit(this.selected);
    }

}
