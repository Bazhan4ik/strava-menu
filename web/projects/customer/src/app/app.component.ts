import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';



@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {


    constructor(
        private iconRegistry: MatIconRegistry,
    ) {
        this.iconRegistry.setDefaultFontSetClass('material-icons-outlined');

    }
    
    
    ngOnInit() {

    }
}
