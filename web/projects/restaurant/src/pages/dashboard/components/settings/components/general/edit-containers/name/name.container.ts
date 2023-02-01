import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-name',
    templateUrl: './name.container.html',
    styleUrls: ['./name.container.scss'],
    standalone: true,
    imports: [FormsModule, CommonModule]
})
export class NameContainer implements OnInit {

    changed = false;

    @Input() name: string;
    @Input() description: string;

    newDescription: string;
    newName: string;

    @Output() leave = new EventEmitter();

    input() {
        this.changed = this.newDescription != this.description || this.newName != this.name;
    }

    save() {
        if(!this.changed) {
            return this.leave.emit();
        }
        if(!this.newName || this.newName.length < 2) {
            return;
        }

        this.leave.emit({ name: this.newName, description: this.newDescription });
    }



    ngOnInit(): void {
        this.newDescription = this.description;
        this.newName = this.name;
    }
}
