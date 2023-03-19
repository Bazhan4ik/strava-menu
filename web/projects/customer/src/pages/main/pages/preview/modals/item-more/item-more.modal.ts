import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-item-more',
    templateUrl: './item-more.modal.html',
    styleUrls: ['./item-more.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class ItemMoreModal {

    @Output() leave = new EventEmitter();

    @Input() position: any;
    @Input() isComment: boolean;
    

    close() {
        this.leave.emit();
    }

    comment() {
        this.leave.emit("comment");
    }
    remove() {
        this.leave.emit("remove");
    }
    more() {
        this.leave.emit("more");
    }
    modifiers() {
        this.leave.emit("modifiers");
    }


}
