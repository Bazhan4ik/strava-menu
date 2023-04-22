import { CommonModule } from '@angular/common';
import { Component, Output, Input, AfterViewInit, EventEmitter, ChangeDetectorRef, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Address } from '../../models';
import "@angular/google-maps";
import { InputModalityDetector } from '@angular/cdk/a11y';
import { CustomerService } from 'projects/customer/src/services/customer.service';

@Component({
    selector: 'app-delivery-address',
    templateUrl: './delivery-address.modal.html',
    styleUrls: ['./delivery-address.modal.scss'],
    imports: [CommonModule, MatIconModule, FormsModule],
    standalone: true,
})
export class DeliveryAddressModal implements AfterViewInit, OnInit {
    constructor(private changeDetector: ChangeDetectorRef, private service: CustomerService) { };

    orderingTimes: { value: Date; title: string; }[];
    showFullAddress = false;
    place: google.maps.places.PlaceResult;
    autocompleteInput: string;
    loading = false;

    city: string;
    state: string;
    line1: string;
    line2: string;
    postalCode: string;

    options: any = {
        types: [],
        componentRestrictions: { country: 'CA' },
    };

    templates = {
        street_number: { street_number: 'short_name' },
        route: { route: 'long_name' },
        city: { locality: 'long_name' },
        state: { administrative_area_level_1: 'short_name' },
        stateLong: { administrative_area_level_1: 'long_name' },
        biggerCity: { administrative_area_level_2: 'short_name' },
        country: { country: 'short_name' },
        countryLong: { country: 'long_name' },
        postalCode: { postal_code: 'long_name' },
        phone: { formatted_phone_number: 'formatted_phone_number' },
    };

    errors = {
        line1: false,
        state: false,
        city: false,
        postalCode: false,
        phone: false,
    }


    @ViewChild('placesInput') placesInput: ElementRef;
    @Input() error = false;
    @Input() address: Address;
    @Input() time: Date;
    @Input() phone: string = "+1 (";
    @Output() leave = new EventEmitter();


    close() {
        this.leave.emit();
    }
    async save() {
        let failed = false;
        if (!this.line1 || this.line1.length == 0) {
            this.errors.line1 = true
            failed = true;
        }
        if (!this.postalCode || this.line1.length == 0) {
            this.errors.postalCode = true;
            failed = true;
        }
        if (!this.city || this.line1.length == 0) {
            this.errors.city = true;
            failed = true;
        }
        if (!this.state || this.line1.length == 0) {
            this.errors.state = true;
            failed = true;
        }

        if (this.phone.length != 17 || this.phone.slice(0, 4) != "+1 (" || !/^\+\d \(\d{3}\) \d{3} \d{4}$/.test(this.phone)) {
            this.errors.phone = true;
            failed = true;
        }

        if (failed) {
            return;
        }
        this.errors = { city: false, phone: false, line1: false, state: false, postalCode: false, };

        this.loading = true;

        const update: any = await this.service.put({
            city: this.city,
            line1: this.line1,
            line2: this.line2,
            state: this.state,
            postalCode: this.postalCode,
            phone: this.phone,
            time: this.time,
        }, "session/delivery/address");


        this.loading = false;


        if (update.updated) {
            this.leave.emit({
                city: this.city,
                line1: this.line1,
                line2: this.line2,
                state: this.state,
                postalCode: this.postalCode,
                phone: this.phone,
            });
        } else {
            this.error = true;
        }
    }


    ngAfterViewInit() {
        this.getPlaceAutocomplete();
    }
    ngOnInit() {
        if (this.phone.slice(0, 4) != "+1 (") {
            this.phone = "+1 (";
        }
        if (this.address) {
            this.line1 = this.address.line1;
            this.line2 = this.address.line2;
            this.city = this.address.city;
            this.postalCode = this.address.postalCode;
            this.state = this.address.state;

            this.showFullAddress = true;
        }
        const date = new Date();
        date.setHours(23, 0, 0);
        const result = this.getOrderingTimes(date);
        this.orderingTimes = result;
        if (!this.time) {
            this.time = this.orderingTimes[0].value;
        }
    }

    onPhoneInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value;

        const key = (event as any).data;

        if (key == " ") {
            input.value = value.slice(0, value.length - 1);
            return;
        }

        if (!key && value.length > 2) { // backspace
            if(input.value.length < 4) {
                input.value = "+1 (";
            } else if (input.value.length == 8) {
                input.value = value.slice(0, value.length - 2);
            } else if (input.value.length == 13) {
                input.value = value.slice(0, value.length - 1);
            }
            return;
        }

        if (isNaN(+key)) { // not a number
            input.value = value.slice(0, value.length - 1);
            return;
        }

        if (value.length < 4 || value.slice(0, 4) != "+1 (") {
            input.value = "+1 (" + key;
            return;
        }

        if (value.length == 7) {
            input.value = value + ") ";
        }

        if (value.length == 8) {
            input.value = value.slice(0, value.length - 1) + ") " + key;
        }

        if (value.length == 12) {
            input.value = value + " ";
        }

        if(value.length == 13) {
            input.value = value.slice(0, value.length - 1) + " " + key;    
        }

        if (value.length > 17) {
            input.value = value.slice(0, 17);
            this.phone = value.slice(0, 17);
        }
    }
    private getPlaceAutocomplete() {
        const autocomplete = new google.maps.places.Autocomplete(this.placesInput.nativeElement,
            {
                componentRestrictions: { country: "CA" },
                types: []  // 'establishment' / 'address' / 'geocode'
            }
        );

        google.maps.event.addListener(autocomplete, "place_changed", () => {
            const place = autocomplete.getPlace();

            this.place = place;

            this.city = this.getAddrComponent(this.templates.city);
            this.state = this.getAddrComponent(this.templates.state);
            this.line1 = this.getAddrComponent(this.templates.street_number) + " " + this.getAddrComponent(this.templates.route);
            this.postalCode = this.getAddrComponent(this.templates.postalCode);

            this.changeDetector.detectChanges();
        });
    }
    getAddrComponent(componentTemplate: { [key: string]: string }) {
        let result;

        for (let component of this.place.address_components!) {
            const addressType = component.types[0];
            if (componentTemplate[addressType]) {
                result = (component as any)[componentTemplate[addressType]];
                return result;
            }
        }
        return;
    }
    getOrderingTimes(closingTime: Date): { value: Date; title: string; }[] {
        const orderingTimes = [];
        const currentTime = new Date();

        // Set current time to nearest 10 minute mark
        const currentMinute = Math.ceil(currentTime.getMinutes() / 10) * 10;
        currentTime.setMinutes(currentMinute);

        // Calculate first ordering time, 30 minutes from current time
        const firstOrderingTime = new Date(currentTime.getTime() + 30 * 60000);

        // Set the maximum allowed closing time to 22:30
        const maxClosingTime = new Date(closingTime);
        maxClosingTime.setHours(22, 30, 0, 0);

        // Use the earlier time between closingTime and maxClosingTime
        const finalClosingTime = closingTime < maxClosingTime ? closingTime : maxClosingTime;

        if (firstOrderingTime < finalClosingTime) {
            orderingTimes.push({
                value: firstOrderingTime,
                title: `${firstOrderingTime.getHours().toString().padStart(2, '0')}:${firstOrderingTime.getMinutes().toString().padStart(2, '0')}`
            });
        }

        // Calculate subsequent ordering times, every 10 minutes after the first
        let nextOrderingTime = new Date(firstOrderingTime.getTime() + 20 * 60000);
        while (nextOrderingTime < finalClosingTime) {
            orderingTimes.push({
                value: nextOrderingTime,
                title: `${nextOrderingTime.getHours().toString().padStart(2, '0')}:${nextOrderingTime.getMinutes().toString().padStart(2, '0')}`
            });
            nextOrderingTime = new Date(nextOrderingTime.getTime() + 20 * 60000);
        }

        return orderingTimes;
    }
}
