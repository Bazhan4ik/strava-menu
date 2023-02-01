import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-add-restaurant',
  templateUrl: './add-restaurant.page.html',
  styleUrls: ['./add-restaurant.page.scss']
})
export class AddRestaurantPage {
    name: string;

    constructor(
        private service: UserService,
        private router: Router,
    ) {}

    async submit() {
        const result: any = await this.service.post({ name: this.name }, "add-restaurant");

        if(result.added) {
            this.router.navigate(["home"]);
        }
    }
}
