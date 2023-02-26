import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-remove-dish',
    templateUrl: './remove-dish.modal.html',
    styleUrls: ['./remove-dish.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, FormsModule],
})
export class RemoveDishModal {

    reason: string = "not-selected";

    @Output() leave = new EventEmitter();

    submit() {
        this.leave.emit(this.reason);
    }

    close() {
        this.leave.emit();
    }
}
