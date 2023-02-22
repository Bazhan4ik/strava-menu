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

interface LocationPayments {
    id: string;
    name: string;
    card: boolean;
    cash: boolean;
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

    locationsPayments: LocationPayments[];

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

    async onLocationMethodChange(locationId: string, ev: any, t: string) {
        const value = ev.target.checked;

        try {
            const update: any = await this.service.put({ type: t, value }, "locations", locationId, "methods");
    
            for(let i of this.locationsPayments) {
                if(i.id == locationId) {
                    i[t as "card" | "cash"] = value;
                    break;
                }
            }

            if(!update.updated) {
                ev.target.checked = !value;
            }
        } catch (e: any) {
            if(e.status == 403) {
                console.error("ACCOUNT NOT VERIFIED");
            }
        }

    }


    async ngOnInit() {
        const result: {
            name: boolean;
            dob: boolean;
            address: Location;
            bankAccount: BankAccount;
            locations: any[];
            locationsPayments: LocationPayments[]
        } = await this.service.get("settings/payments");


        this.savedLocations = result.locations;
        
        this.address = result.address;
        this.isDobRequired = !result.dob;
        this.isNameRequired = !result.name;
        this.bankAccount = result.bankAccount;

        this.loaded = true;

        this.locationsPayments = result.locationsPayments;

        console.log(result);
    }
}
