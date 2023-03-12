import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-custom-tip',
    templateUrl: './custom-tip.modal.html',
    styleUrls: ['./custom-tip.modal.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule]
})
export class CustomTipModal {

    @Output() leave = new EventEmitter();
    @Input() amount: number = null!;


    close() {
        this.leave.emit();
    }
    save() {
        this.leave.emit(this.amount);
    }
}
