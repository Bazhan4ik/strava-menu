import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

@Component({
    selector: 'app-confirmation',
    templateUrl: './confirmation.modal.html',
    styleUrls: ['./confirmation.modal.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
})
export class ConfirmationModal {

    loading: boolean;

    name: string;

    constructor(
        private service: RestaurantService,
    ){}

    @Input() city: string;
    @Input() addressLine1: string;
    @Input() addressLine2: string;
    @Input() state: string;
    @Input() postalCode: string;
    @Input() latlng: google.maps.LatLng;

    @Output() leave = new EventEmitter();


    async save() {

        if(!this.name || this.name.length < 1) {
            return;
        }

        this.loading = true;

        const result: any = await this.service.post({
            addressLine1: this.addressLine1.trim(),
            addressLine2: this.addressLine2?.trim() || null,
            city: this.city.trim(),
            state: this.state.trim(),
            postalCode: this.postalCode.replaceAll(" ", ""),
            name: this.name.trim(),
            latlng: {
                lat: this.latlng.lat(),
                lng: this.latlng.lng(),
            }
        }, "locations");

        if(result.updated) {
            this.leave.emit(true);
        }
    }

    cancel() {
        this.leave.emit();
    }


}
