import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-worker-shift',
    templateUrl: './worker-shift.modal.html',
    styleUrls: ['./worker-shift.modal.scss'],
    standalone: true,
    imports: [FormsModule, MatIconModule]
})
export class WorkerShiftModal {
    constructor() { };


    days: number[] = [];

    startHours: string;
    startMinutes: string;
    endHours: string;
    endMinutes: string;


    @Input() title: string = "Add Shift";
    @Input() error: boolean = false;
    @Output() leave = new EventEmitter();






    hourInput(event: Event, v: "startHours" | "endHours") {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        const key = (event as any).data;

        if(isNaN(+key)) {
            input.value = value.slice(0, value.length - 1);
            this[v] = input.value;
            return;
        }

        if(value.length == 1 && +value[0] > 2) {
            input.value = "";
            this[v] = "";
            return;
        }

        if(value.length == 2 && (+value > 24 || +value < 1)) {
            input.value = value.slice(0, 1);
            this[v] = input.value;
            return;
        }

        if(value.length > 2) {
            input.value = value.slice(0, 2);
            this[v] = input.value;
        }
    }
    minuteInput(event: Event, v: "endMinutes" | "startMinutes") {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        const key = (event as any).data;

        if(isNaN(+key)) {
            input.value = value.slice(0, value.length - 1);
            this[v] = input.value;
            return;
        }

        if(value.length == 1 && +value[0] > 5) {
            input.value = "";
            this[v] = "";
            return;
        }

        if(value.length == 2 && (+value > 59 || +value < 1)) {
            input.value = value.slice(0, 1);
            this[v] = input.value;
            return;
        }

        if(value.length > 2) {
            input.value = value.slice(0, 2);
            this[v] = input.value;
        }
    }
    selectDay(n: number) {
        if(this.days.includes(n)) {
            this.days.splice(this.days.indexOf(n), 1);
            return;
        }
        this.days.push(n);
    }
    save() {
        const startHours = +this.startHours;
        const startMinutes = +this.startMinutes;
        const endHours = +this.endHours;
        const endMinutes = +this.endMinutes;

        if(startHours > endHours) {
            return;
        } else if(startHours == endHours && startMinutes > endMinutes) {
            return;
        }
        if(this.days.length == 0) {
            return;
        }


        this.leave.emit({ startHours, startMinutes, endHours, endMinutes, days: this.days });
    }
    close() {
        this.leave.emit();
    }
}
