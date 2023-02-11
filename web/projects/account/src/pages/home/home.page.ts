import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { env } from "./../../../../../environment/environment";

interface User {
    name: {
        first: string;
        last: string;
    }
    avatar: any;
    restaurants: { name: string; id: string; redirectUrl: string; redirectTo: string; }[]
}


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {

    user: User;

    avatar: string;

    openPopover: boolean;
    popoverPosition: { right: number; bottom: number; };

    constructor(
        private service: UserService,
    ) {};

    @ViewChild("popoverButton") popoverButton: ElementRef;


    more() {
        this.popoverPosition = this.popoverButton.nativeElement.getBoundingClientRect(this.popoverButton);

        this.openPopover = true;
    }

    closePopover(logout: boolean) {
        this.openPopover = false;
        this.popoverPosition = null!;

        if(logout) {
            this.service.logout();
        }
    }


    async ngOnInit() {
        
        const result: User = await this.service.get<User>("");
        

        console.log(result);

        for(let restaurant of result.restaurants) {
            restaurant.redirectUrl = `${ env.restaurantUrl }/${ restaurant.redirectTo == 'staff' ? 'staff' : 'dashboard' }/${restaurant.id}`;
        }

        this.user = result;


    }
}
