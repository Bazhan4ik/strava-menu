import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Collection } from '../../models/collection';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, NgOptimizedImage],
})
export class FolderComponent implements OnInit {
    constructor(private service: CustomerService) {};


    @ViewChild("list") list: ElementRef;
    @Input() collections: Collection[];





    ngOnInit() {
        const collections = [];
        console.log(this.collections);
        for(const collection of this.collections) {
            collections.push({
                ...collection,
                image: collection.hasImage ? `${env.apiUrl}/customer/${this.service.restaurant._id}/collections/${collection.id}/image` : "./../../../../../../../global-resources/images/no-image.svg"
            });
        }
        this.collections = collections;
    }



    right() {
        this.list.nativeElement.scrollLeft += 300;
    }
    left() {
        this.list.nativeElement.scrollLeft -= 300;
    }
}
