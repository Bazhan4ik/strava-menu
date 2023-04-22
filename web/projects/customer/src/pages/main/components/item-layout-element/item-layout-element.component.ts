import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Item } from '../../models/item';

@Component({
    selector: 'app-item-layout-element',
    templateUrl: './item-layout-element.component.html',
    styleUrls: ['./item-layout-element.component.scss'],
    standalone: true,
    imports: [CommonModule, NgOptimizedImage, RouterModule],
})
export class ItemLayoutElementComponent implements OnInit {

    imageUrl: string;

    constructor(
        private service: CustomerService,
    ) { };

    @Input() item: Item;


    async ngOnInit() {
        console.log(this.item);
        this.imageUrl = `${env.apiUrl}/customer/${this.service.restaurant._id}/items/${this.item._id}/image`;
    }
}
