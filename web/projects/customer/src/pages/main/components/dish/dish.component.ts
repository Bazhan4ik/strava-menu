import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { Dish } from '../../models/dish';

@Component({
  selector: 'app-dish',
  templateUrl: './dish.component.html',
  styleUrls: ['./dish.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DishComponent implements OnInit {

    image: string = "./../../../../../../../dashboard/global-resources/images/no-image.svg"; // FIX THE DASHBOARD THING

    @Input() dish: Dish;
    @Input() collection: string;
    @Input() goDown: boolean;
    @Input() small: boolean;



    ngOnInit() {

        if(this.dish.image) {
            this.image = getImage(this.dish.image.buffer);
        }

    }

}
