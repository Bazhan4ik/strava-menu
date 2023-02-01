import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaymentsRoutingModule } from './payments-routing.module';
import { PaymentsPage } from './payments.page';
import { MatIconModule } from '@angular/material/icon';
import { AddressContainer } from './requirements/address/address.container';
import { DobContainer } from './requirements/dob/dob.container';
import { BankAccountContainer } from './requirements/bank-account/bank-account.container';
import { NameContainer } from './requirements/name/name.container';
import { FormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        PaymentsPage,
        AddressContainer,
        DobContainer,
        BankAccountContainer,
        NameContainer,
    ],
    imports: [
        CommonModule,
        PaymentsRoutingModule,
        MatIconModule,
        FormsModule,
    ]
})
export class PaymentsModule { }
