import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-dish',
    templateUrl: './dish.component.html',
    styleUrls: ['./dish.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class DishComponent {


    @Input() dish: { name: string; price: number; description: string; };



}
