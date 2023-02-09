import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-worker-settings',
    templateUrl: './worker-settings.component.html',
    styleUrls: ['./worker-settings.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class WorkerSettingsComponent {
    

    @Input() settings = {
        work: {
            cook: false,
            waiter: false,
        },
        dishes: {
            removing: false,
            adding: false,
        },
        collections: {
            removing: false,
            adding: false,
        },
        staff: {
            settings: false,
            firing: false,
            hiring: false,
        },
        customers: {
            blacklisting: false,
            tables: false,
        },
        locations: {
            adding: false,
            removing: false,
        },
        settings: {
            customers: false,
            payments: false,
            info: false,
        },
    };
    @Output() change = new EventEmitter();

    onChange() {
        this.change.emit(this.settings);
    }
}
