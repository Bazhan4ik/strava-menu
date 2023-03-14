import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface Option {
    name: string;
    price: number;
}

interface Modifier {
    name: string;
    amountToSelect: "less" | "more" | "equal" | "one" | "none";
    amountOfOptions: number;
    options: Option[];
    required: boolean;
}

@Component({
    selector: 'app-add-modifier',
    templateUrl: './add-modifier.modal.html',
    styleUrls: ['./add-modifier.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, FormsModule],
})
export class AddModifierModal {

    modifierName: string;
    required: boolean = false;
    options: Option[] = [{ name: "", price: null! }];
    amountOfOptions: number;
    amountToSelect: string = "none";

    placeholder: string;
    red: boolean;


    @Output() leave = new EventEmitter();

    close() {
        this.leave.emit();
    }

    removeRed() {
        this.red = false;
    }

    save() {
        const wrongName = !this.modifierName || this.modifierName.length < 2;
        const wrongAmountOptions = !this.amountToSelect || !["less", "more", "one"].includes(this.amountToSelect);
        const shouldntBeLessThan2IfLess = (this.amountToSelect == "less" && this.amountOfOptions < 2);
        const shouldntBeMoreThanOptionsIfMore = (this.amountToSelect == "more" && this.amountOfOptions >= this.options.length);
        const shouldBeOneIfOne = (this.amountToSelect == "one" && this.amountOfOptions != 1);
        const shouldntBeEqualIfMoreThanOptionsLength = (this.amountToSelect == "more" && this.amountOfOptions > this.options.length);
        const wrongOptionsAmount = !this.amountOfOptions || this.amountOfOptions < 1 || shouldntBeLessThan2IfLess || shouldntBeMoreThanOptionsIfMore;
        const wrongRequired = typeof this.required != "boolean";
        const wrongOptions = !this.options || this.options.length < 2;

        if(wrongName || wrongAmountOptions || wrongRequired || shouldBeOneIfOne || wrongOptionsAmount || wrongOptions || shouldntBeEqualIfMoreThanOptionsLength) {
            this.red = true;
            return;
        }
        for(let option of this.options) {
            if(!option.name || option.name.length < 2) {
                this.red = true;
                return;
            }
        }

        this.red = false;

        this.leave.emit(<Modifier>{
            options: this.options,
            amountOfOptions: this.amountOfOptions,
            amountToSelect: this.amountToSelect,
            name: this.modifierName,
            required: this.required,
        });
    }

    addOption() {
        this.options.push({ name: "", price: null! });
    }
    deleteOption(optionIndex: number) {
        this.options.splice(optionIndex, 1);
    }


    onRequiredChanged(ev: Event) {
        const input: HTMLInputElement = ev.target as HTMLInputElement;

        this.required = input.checked;
    }


    onAmountSelectedChanged() {
        switch (this.amountToSelect) {
            case "less":
                this.placeholder = "Less than what?";
                break;
            case "more":
                this.placeholder = "More than what?";
                break;
            case "one":
                this.amountOfOptions = 1;
                break;
        }
    }

}
