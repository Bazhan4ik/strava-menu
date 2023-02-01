import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';



@Component({
    selector: 'app-menu',
    templateUrl: './menu.page.html',
    styleUrls: ['./menu.page.scss']
})
export class MenuPage implements OnInit {

    currentPage: string;

    constructor(
        private router: Router,
    ) {
        this.router.events.subscribe((ev: any) => {
            if(ev instanceof NavigationEnd) {
                this.currentPage = ev.url.split("/")[3];
            }
        });        
    }
    
    
    ngOnInit(): void {
        this.currentPage = this.router.url.split("/")[3] || "dishes";
    }
}
