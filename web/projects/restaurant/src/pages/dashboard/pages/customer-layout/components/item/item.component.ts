import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class ItemComponent {


    @Input() item: { name: string; price: number; description: string; };



}
