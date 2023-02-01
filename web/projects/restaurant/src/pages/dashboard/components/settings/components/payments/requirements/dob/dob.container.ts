import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-dob',
    templateUrl: './dob.container.html',
    styleUrls: ['./dob.container.scss']
})
export class DobContainer {

    date: string;
    loading = false;

    constructor(
        
    ) {}


    @Output() leave = new EventEmitter();


    onInput(ev: any) {
        let { value } = <{ value: string; }>ev.target;
        
        if((ev.data && isNaN(+ev.data)) || ev.data == " ") {
            ev.target.value = value.slice(0, value.length - 1);
            return;
        }

        if(ev.data) { // NOT BACKSPACE
            if(value.length == 2 || value.length == 5) {
                ev.target.value += "/";
            }
            if(value.length == 3) { // ADD '/' AFTER THE SECOND NUMBER
                const nw = value.split("");
                nw.splice(2, 0, "/");
                ev.target.value = nw.join("");
            }
            if(value.length == 6) { // ADD '/' AFTER THE FIFTH NUMBER
                const nw = value.split("");
                nw.splice(5, 0, "/");
                ev.target.value = nw.join("");
            }
            if(value.length >= 11) {
                ev.target.value = value.slice(0, value.length - 1);
            }
        } else { // BACKSPACE
            if(!ev.data && (value.length == 3 || value.length == 6)) {
                ev.target.value = value.slice(0, value.length - 1);
            }
        }

        this.date = ev.target.value;
    }

    save() {
        if(!this.date || this.date.length != 10) {
            return;
        }

        const [month, date, year] = this.date.split("/");

        if(isNaN(+month) || isNaN(+date) || isNaN(+year)) {
            return;
        }

        if(+month < 1 || +month > 12) {
            return;
        }

        if(+date < 1 || +date > 31) {
            return;
        }

        if(+year < 1900 || +year > 2022) {
            return;
        }

        const dob = {
            month: +month,
            year: +year,
            date: +date,
        };
        
        this.loading = true;

        this.leave.emit(dob);
    }

}
