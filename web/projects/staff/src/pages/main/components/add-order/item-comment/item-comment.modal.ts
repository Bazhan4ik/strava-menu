import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-item-comment',
    templateUrl: './item-comment.modal.html',
    styleUrls: ['./item-comment.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, FormsModule],
})
export class ItemCommentModal {



    constructor() { };


    @Output() leave = new EventEmitter();
    @Input() comment = "";

    close() {
        this.leave.emit();
    }

    save() {
        this.leave.emit(this.comment);
    }

}
