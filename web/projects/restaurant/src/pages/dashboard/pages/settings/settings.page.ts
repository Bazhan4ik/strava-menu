import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage implements OnInit {
    currentPage = "general";
    menuOpened = false;

    constructor(
        private router: Router,
    ) {
        this.router.events.subscribe(event => {
            if(event instanceof NavigationEnd) {
                const url = event.url.split('?')[0]; 
                const thirdRoute = url.split('/')[3] || "general";

                this.currentPage = thirdRoute;
            }
        });
    }

    openMenu() {
        this.menuOpened = !this.menuOpened;
    }

    ngOnInit() {
        this.currentPage = this.router.url.split('?')[0].split('/')[3] || "general";

    }
}
