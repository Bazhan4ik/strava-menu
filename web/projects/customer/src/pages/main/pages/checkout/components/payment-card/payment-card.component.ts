import { CommonModule } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
// @ts-ignore
import * as CryptoJS from 'crypto-js';

@Component({
    selector: 'app-payment-card',
    templateUrl: './payment-card.component.html',
    styleUrls: ['./payment-card.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
})
export class PaymentCardComponent {
    brand: string;


    errors = {
        number: false,
        exp: false,
        cvc: false,
        postalCode: false,
    }
    cardInfo = {
        number: "",
        exp: "",
        cvc: "",
        postalCode: "",
    };


    @Input() error: boolean;
    @Output() getCardInfo(key: string) {
        let failed = false;
        if (this.cardInfo.number.length != 19) {
            failed = true;
            this.errors.number = true;
        }
        if (this.cardInfo.exp.length != 7) {
            failed = true;
            this.errors.exp = true;
        }
        if (this.cardInfo.cvc.length != 3) {
            failed = true;
            this.errors.cvc = true;
        }
        if (this.cardInfo.postalCode.length != 7) {
            failed = true;
            this.errors.postalCode = true;
        }
        if (failed) {
            return;
        }

        const number = this.cardInfo.number.replaceAll(" ", "");
        const exp = this.cardInfo.exp.replaceAll(" ", "");
        const cvc = this.cardInfo.cvc;
        const postalCode = this.cardInfo.postalCode;

        return this.encrypt(JSON.stringify({
            number,
            exp,
            cvc,
            postalCode,
        }), key);
    }

    onCardInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        const key = (event as any).data;

        if (!key) { // Backspace or paste
            if (value.length === 4) {
                input.value = value.slice(0, 3)
            } else if (value.length === 9) {
                input.value = value.slice(0, 8);
            } else if (value.length === 14) {
                input.value = value.slice(0, 13);
            } else if (value.length > 19) {
                input.value = value.slice(0, 19);
            }

            
            if (!/^[0-9\s]+$/.test(input.value)) {
                input.value = "";
                return;
            }
        }

        this.errors.number = false;

        if (isNaN(+key)) {
            input.value = value.slice(0, value.length - 1);
            return;
        }

        let nv = value.replaceAll(" ", "");
        if (nv.length > 4) {
            nv = nv.slice(0, 4) + " " + nv.substring(4);
        }
        if (nv.length > 9) {
            nv = nv.slice(0, 9) + " " + nv.substring(9);
        }
        if (nv.length > 14) {
            nv = nv.slice(0, 14) + " " + nv.substring(14);
        }

        input.value = this.cardInfo.number = nv.slice(0, 19);

        this.brand = this.getBrand();
    }
    onExpireInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        const key = (event as any).data;

        if (!key) { // Backspace
            if (value.length === 4) {
                input.value = value.slice(0, 1);
            }
            if (value.length > 5) {
                if (value.slice(2, 5) != " / ") {
                    input.value = "";
                    return;
                }
            }
            return;
        }

        this.errors.exp = false;

        if (isNaN(+key)) {
            input.value = value.slice(0, value.length - 1);
            return;
        }

        if (value.length === 2) {
            input.value = value + " / ";
        }


        if (value.length > 2) {
            if (value.slice(2, 5) != " / ") {
                input.value = value.slice(0, 2) + " / " + value.slice(6, 8);
                return;
            }
        }


        if (value.length > 7) {
            input.value = value.slice(0, 7);
            this.cardInfo.exp = value.slice(0, 7);
        }

    }
    onCvcInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        const key = (event as any).data;

        if (!key) { // Backspace
            if (value.length > 4) {
                input.value = value.slice(0, 3);
            }
            return;
        }

        if (isNaN(+key)) {
            input.value = value.slice(0, value.length - 1);
            return;
        }

        this.errors.cvc = false;

        if (value.length > 3) {
            if (this.brand == "amex") {
                input.value = value.slice(0, 4);
                this.cardInfo.cvc = value.slice(0, 4);
            } else {
                input.value = value.slice(0, 3);
                this.cardInfo.cvc = value.slice(0, 3);
            }
        }

        this.cardInfo.cvc = input.value;
    }
    onPostalCodeInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        const key = (event as any).data;

        if (!key) { // Backspace
            if (value.length == 3) {
                input.value = value.slice(0, 2);
            }
            return;
        }

        if (isNaN(+key)) {
            input.value = value.toUpperCase();
        }

        this.errors.postalCode = false;

        let nv = input.value.replace(" ", "");
        if (nv.length > 3) {
            input.value = nv.slice(0, 3) + " " + nv.substring(3);
        }

        if (input.value.length > 7) {
            input.value = input.value.slice(0, 7);
            this.cardInfo.postalCode = value.slice(0, 7);
        }
    }

    /**
     * Get the brand of the card
     */
    getBrand() {
        const number = this.cardInfo.number.replace(/[\s-]/g, '');

        var re = new RegExp("^4");
        if (number.match(re) != null)
            return "visa";

        if (/^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(number))
            return "mastercard";

        re = new RegExp("^3[47]");
        if (number.match(re) != null)
            return "amex";

        re = new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)");
        if (number.match(re) != null)
            return "discover";

        re = new RegExp("^36");
        if (number.match(re) != null)
            return "diners";

        re = new RegExp("^30[0-5]");
        if (number.match(re) != null)
            return "diners";

        re = new RegExp("^35(2[89]|[3-8][0-9])");
        if (number.match(re) != null)
            return "jcb";

        re = new RegExp("^(4026|417500|4508|4844|491(3|7))");
        if (number.match(re) != null)
            return "visa";

        return null!;
    }
    encrypt(plainText: string, key: string): string {
        const encrypted = CryptoJS.AES.encrypt(plainText, key).toString();
        return encrypted;
    }
}
