import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { env } from 'environment/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    loginLink: string;
    registerLink: string;

    constructor(
        private iconRegistry: MatIconRegistry,
    ) {
        this.iconRegistry.setDefaultFontSetClass('material-icons-outlined');
    }

    ngOnInit(): void {
        this.loginLink = `${env.accountUrl}/login`;
        this.registerLink = `${env.accountUrl}/register`;
    }

}
