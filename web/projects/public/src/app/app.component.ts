import { Component, OnInit } from '@angular/core';
import { env } from 'environment/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    loginLink: string;
    registerLink: string;

    ngOnInit(): void {
        this.loginLink = `${env.accountUrl}/login`;
        this.registerLink = `${env.accountUrl}/register`;
    }

}
