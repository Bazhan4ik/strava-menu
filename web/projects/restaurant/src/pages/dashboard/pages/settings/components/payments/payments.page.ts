import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';


interface Location {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
}
interface BankAccount {
    last4: string;
    currency: string;
    status: string;
}


@Component({
    selector: 'app-payments',
    templateUrl: './payments.page.html',
    styleUrls: ['./payments.page.scss']
})
export class PaymentsPage implements OnInit {
    
    address: Location;
    bankAccount: BankAccount;
    isDobRequired: boolean;
    isNameRequired: boolean;

    savedLocations: any[];

    loaded = false;

    constructor(
        private service: RestaurantService,
    ) {};


    async onAddressEdit(location: any) {
        const update: any = await this.service.post({ location: location._id }, "settings/payments/address");

        if(update.updated) {
            this.address = location;
        }

    }

    async onDobEdit(dob: any) {
        const update: any = await this.service.post({ dob }, "settings/payments/dob");

        if(update.updated) {
            this.isDobRequired = false;
        }
    }

    async onNameEdit(name: any) {
        const update: any = await this.service.post({ name }, "settings/payments/name");

        if(update.updated) {
            this.isNameRequired = false;
        }
    }

    async onBankAccountEdit(bankAccount: any) {
        const update: any = await this.service.post(bankAccount, "settings/payments/bank-account");

        if(update.updated) {
            this.bankAccount = update.bankAccount;
        }
    }


    async ngOnInit() {
        const result: {
            name: boolean;
            dob: boolean;
            address: Location;
            bankAccount: BankAccount;
            locations: any[];
        } = await this.service.get("settings/payments");


        this.savedLocations = result.locations;
        
        this.address = result.address;
        this.isDobRequired = !result.dob;
        this.isNameRequired = !result.name;
        this.bankAccount = result.bankAccount;

        this.loaded = true;

        console.log(result);
    }
}
