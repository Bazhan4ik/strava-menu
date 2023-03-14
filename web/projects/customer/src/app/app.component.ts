import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { pairwise, } from "rxjs";



@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {


    constructor(
        private iconRegistry: MatIconRegistry,
        private router: Router,
        private location: Location,
    ) {
        this.iconRegistry.setDefaultFontSetClass('material-icons-outlined');

    }
    
    
    ngOnInit() {

    }
}
