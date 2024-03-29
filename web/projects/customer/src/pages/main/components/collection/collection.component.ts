import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Collection } from '../../models/collection';
import { DishComponent } from '../item/item.component';

@Component({
    selector: 'app-collection',
    templateUrl: './collection.component.html',
    styleUrls: ['./collection.component.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, DishComponent]
})
export class CollectionComponent implements AfterViewInit {


    @Input() collection: Collection;
    @Input() small: boolean = false;
    @Input() goDown: boolean = false;

    @ViewChild("list") list: ElementRef;

    right() {
        this.list.nativeElement.scrollLeft += 400;
    }
    left() {
        this.list.nativeElement.scrollLeft -= 400;
    }

    ngAfterViewInit() {
    }

}
