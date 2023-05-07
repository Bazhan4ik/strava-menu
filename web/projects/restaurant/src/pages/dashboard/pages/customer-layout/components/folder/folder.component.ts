import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-folder',
    templateUrl: './folder.component.html',
    styleUrls: ['./folder.component.scss']
})
export class FolderComponent implements OnInit {



    @Input() collections: {
        name: string;
        id: string;
        _id: string;
        items: string[];
    }[];


    ngOnInit() {
    }
}
