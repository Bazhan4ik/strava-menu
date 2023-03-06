import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-collection',
    templateUrl: './collection.component.html',
    styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent implements OnInit {

    @Input() collection: {
        id: string;
        name: string;
        _id: string;
        dishes: { name: string; price: number; id: string; _id: string; }[];
    }


    ngOnInit() {
    }
}
