import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { Collection } from '../../models/collection';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
})
export class FolderComponent implements OnInit {

    collections: Collection[] = [];

    @Input() folder: {
        name: string;
        collections: Collection[];
    };


    @ViewChild("list") list: ElementRef;

    right() {
        this.list.nativeElement.scrollLeft += 300;
    }
    left() {
        this.list.nativeElement.scrollLeft -= 300;
    }


    ngOnInit() {
        for(const collection of this.folder.collections) {
            this.collections.push({
                ...collection,
                image: getImage(collection.image) || "./../../../../../../../global-resources/images/no-image.svg"
            });
        }
    }
}
