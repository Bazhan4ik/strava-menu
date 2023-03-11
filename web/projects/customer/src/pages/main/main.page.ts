import { Component, OnInit, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from '../../services/customer.service';




@Component({
    selector: 'app-main',
    templateUrl: './main.page.html',
    styleUrls: ['./main.page.scss']
})
export class MainPage implements OnInit {
    

    async ngOnInit() {

        // const link = this.renderer.createElement('link');
        // link.setAttribute('rel', 'stylesheet');
        // link.setAttribute('type', 'text/css');
        // link.setAttribute('href', 'https://api.mydomain.com:3000/themes/default.css');
        // this.renderer.appendChild(document.head, link);
    }

}
