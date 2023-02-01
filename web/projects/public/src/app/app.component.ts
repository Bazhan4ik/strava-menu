import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    loginLink: string;

    ngOnInit(): void {
        if(window.location.hostname == "www.localhost") {
            this.loginLink = "https://account.localhost:3000/login";
        } else {
            this.loginLink = "https://account.stravamenu.com/login";
        }
    }

}
