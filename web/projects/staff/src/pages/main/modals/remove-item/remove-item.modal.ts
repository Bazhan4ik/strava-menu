import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-remove-item',
    templateUrl: './remove-item.modal.html',
    styleUrls: ['./remove-item.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, FormsModule],
})
export class RemoveItemModal {

    reason: string = "not-selected";

    @Output() leave = new EventEmitter();

    submit() {
        this.leave.emit(this.reason);
    }

    close() {
        this.leave.emit();
    }
}
