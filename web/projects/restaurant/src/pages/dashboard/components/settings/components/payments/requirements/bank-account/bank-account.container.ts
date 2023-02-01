import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-bank-account',
  templateUrl: './bank-account.container.html',
  styleUrls: ['./bank-account.container.scss']
})
export class BankAccountContainer {

    name: string;

    number: string;
    branch: string;
    institution: string;


    @Output() leave = new EventEmitter();


    onNumberInput(ev: any) {
        const { value } = <{ value: string }>ev.target;

        if(ev.data && isNaN(+ev.data)) {
            ev.target.value = value.slice(0, value.length - 1);
            return;
        }

        if(value.length > 12) {
            ev.target.value = value.slice(0, 12);
        }

        this.number = ev.target.value;
    }
    onBranchInput(ev: any) {
        const { value } = <{ value: string }>ev.target;

        if(ev.data && isNaN(+ev.data)) {
            ev.target.value = value.slice(0, value.length - 1);
            return;
        }

        if(value.length > 5) {
            ev.target.value = value.slice(0, 5);
        }

        this.branch = ev.target.value;
    }
    onInstitutionInput(ev: any) {
        const { value } = <{ value: string }>ev.target;

        if(ev.data && isNaN(+ev.data)) {
            ev.target.value = value.slice(0, value.length - 1);
            return;
        }

        if(value.length > 3) {
            ev.target.value = value.slice(0, 3);
        }

        this.institution = ev.target.value;
    }


    save() {
        this.leave.emit({
            number: this.number,
            branch: this.branch,
            institution: this.institution,
            name: this.name,
        });
    }

}
