import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { NavigationEnd, NavigationStart, Router, Scroll } from '@angular/router';
import { Subscription, pairwise, first, filter } from "rxjs";



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
        this.router.events
            .pipe(pairwise())
            .subscribe(([ev1, ev2]) => {
                if(ev1 instanceof NavigationStart && ev2 instanceof NavigationEnd) {
                    
                    console.log("START AND ENd");
                    

                    window.scrollTo(0, 0)
                }
            });
    }
}
