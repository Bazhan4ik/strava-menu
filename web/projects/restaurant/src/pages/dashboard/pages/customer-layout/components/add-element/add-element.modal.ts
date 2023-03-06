import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-add-element',
    templateUrl: './add-element.modal.html',
    styleUrls: ['./add-element.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, FormsModule],
})
export class AddElementModal {
    type = "none";



    @Output() leave = new EventEmitter();

    close() {
        this.leave.emit();
    }

    save() {
        this.leave.emit(this.type);
    }

}
