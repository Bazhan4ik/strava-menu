import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-name',
    templateUrl: './name.container.html',
    styleUrls: ['./name.container.scss']
})
export class NameContainer {
    first: string;
    last: string;

    loading = false;


    @Output() leave = new EventEmitter();


    save() {
        if(this.first.length == 0 || this.last.length == 0) {
            return;
        }
        
        this.loading = true;

        this.leave.emit({ firstName: this.first, lastName: this.last });
    }
}
