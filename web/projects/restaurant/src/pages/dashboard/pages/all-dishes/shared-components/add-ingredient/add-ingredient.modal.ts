import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-add-ingredient',
    templateUrl: './add-ingredient.modal.html',
    styleUrls: ['./add-ingredient.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, FormsModule]
})
export class AddIngredientModal {

    amount: number;

    @Input() ingredient: { title: string; id: string; };
    @Output() leave = new EventEmitter();

    save() {
        this.leave.emit(this.amount);
    }

    close() {
        this.leave.emit();
    }

}
