import { Component, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, ViewContainerRef } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { GoogleMap } from "@angular/google-maps";
import { Router } from '@angular/router';

@Component({
    selector: 'app-add-location',
    templateUrl: './add-location.page.html',
    styleUrls: ['./add-location.page.scss']
})
export class AddLocationPage implements AfterViewInit {

    options: any = {
        types: [],
        componentRestrictions: { country: 'US' },
    };

    autocompleteInput: string;

    place: google.maps.places.PlaceResult;

    mapOptions: google.maps.MapOptions = {
        zoom: 14,
        disableDefaultUI: true,
        minZoom: 13,
    };
    markerOptions: google.maps.MarkerOptions = {
        draggable: false,
        optimized: true,
    }

    templates = {
        street_number: { street_number: 'short_name' },
        route: { route: 'long_name' },
        city:  { locality: 'long_name' },
        state: { administrative_area_level_1: 'short_name' },
        stateLong: { administrative_area_level_1: 'long_name' },
        biggerCity: { administrative_area_level_2: 'short_name' },
        country: { country: 'short_name' },
        countryLong: { country: 'long_name' },
        postalCode: { postal_code: 'long_name' },
        phone: { formatted_phone_number: 'formatted_phone_number' },
    };


    city: string;
    state: string;
    addressLine1: string;
    addressLine2: string;
    postalCode: string;

    placeLocation: google.maps.LatLng;



    constructor(
        private service: RestaurantService,
        private changeDetector: ChangeDetectorRef,
        private router: Router,
    ) {
    }

    @ViewChild('placesInput') placesInput: ElementRef;
    @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer: ViewContainerRef;
    @ViewChild(GoogleMap) googleMap: GoogleMap;


    private getPlaceAutocomplete() {
        const autocomplete = new google.maps.places.Autocomplete(this.placesInput.nativeElement,
            {
                componentRestrictions: { country: "CA" },
                types: []  // 'establishment' / 'address' / 'geocode'
            }
        );

        google.maps.event.addListener(autocomplete, "place_changed", () => {
            const place = autocomplete.getPlace();

            console.log(place);

            this.place = place;

            this.city = this.getAddrComponent(this.templates.city);
            this.state = this.getAddrComponent(this.templates.state);
            this.addressLine1 = this.getAddrComponent(this.templates.street_number) + " " + this.getAddrComponent(this.templates.route);
            this.postalCode = this.getAddrComponent(this.templates.postalCode);

            this.changeDetector.detectChanges();

            this.placeLocation = this.place.geometry?.location!;
            this.googleMap.panTo(this.place.geometry?.location!);

        });
    }


    async save() {

        if(!this.city || !this.addressLine1 || !this.state || !this.postalCode) {
            return;
        }

        const { ConfirmationModal } = await import("./confirmation/confirmation.modal");

        const component = this.modalContainer.createComponent(ConfirmationModal);

        component.instance.addressLine1 = this.addressLine1;
        component.instance.addressLine2 = this.addressLine2;
        component.instance.city = this.city;
        component.instance.state = this.state;
        component.instance.postalCode = this.postalCode;
        component.instance.latlng = this.place.geometry?.location!;


        component.instance.leave.subscribe((leave: boolean) => {
            if(leave) {
                this.router.navigate([this.service.restaurant.id, "locations"]);
            }
            component.destroy();
        });
    }




    ngAfterViewInit() {
        this.getPlaceAutocomplete();
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
}
